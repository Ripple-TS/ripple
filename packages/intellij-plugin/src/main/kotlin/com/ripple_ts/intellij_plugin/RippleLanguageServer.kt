package com.ripple_ts.intellij_plugin

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.util.ExecUtil
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.SystemInfo
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServerManager
import com.intellij.util.EnvironmentUtil
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

internal object RippleLanguageServer {
	private const val LSP_PACKAGE = "@ripple-ts/language-server"
	private const val LSP_BIN = "ripple-language-server"
	private const val LSP_VERSION_RESOURCE = "/lsp-version.txt"
	private const val FALLBACK_VERSION = "0.2.200"
	private val requiredVersion: String by lazy { readRequiredVersion() }
	private val VERSION_PATTERN = Regex("\"version\"\\s*:\\s*\"([^\"]+)\"")
	private val ROOT_MARKERS = listOf("package.json", "pnpm-workspace.yaml", ".git")
	private val LOG = Logger.getInstance(RippleLanguageServer::class.java)
	private val installLock = Any()

	@Volatile
	private var installInProgress = false

	data class ServerInfo(val binary: Path, val root: Path?)

	private val executableExtension = if (SystemInfo.isWindows) ".cmd" else ""

	fun resolveServer(project: Project, file: VirtualFile?): ServerInfo? {
		val startDir = file?.parent?.path?.let { Paths.get(it) } ?: project.basePath?.let { Paths.get(it) }
		val rootDir = findRoot(startDir) ?: startDir

		val localBinary = findLocalBinary(startDir)
		if (localBinary != null) {
			return ServerInfo(localBinary, rootDir)
		}

		val globalBinary = findGlobalBinary()
		if (globalBinary != null) {
			return ServerInfo(globalBinary, rootDir)
		}

		val installDir = installDir()
		val installedBinary = resolveInstalledBinary(installDir)
		if (installedBinary != null && installedVersion(installDir) == requiredVersion) {
			return ServerInfo(installedBinary, rootDir)
		}

		ensureInstallAsync(project, installDir)
		return null
	}

	private fun findLocalBinary(startDir: Path?): Path? {
		var current = startDir
		while (current != null) {
			val nodeModules = current.resolve("node_modules")
			if (Files.isDirectory(nodeModules)) {
				val binDir = nodeModules.resolve(".bin")
				val bin = binDir.resolve("$LSP_BIN.$executableExtension")
				if (Files.exists(bin)) {
					return bin
				}
			}
			current = current.parent
		}
		return null
	}

	private fun findGlobalBinary(): Path? =
		findExecutableInPath(LSP_BIN)

	private fun findRoot(startDir: Path?): Path? {
		var current = startDir
		while (current != null) {
			if (hasRootMarker(current)) {
				return current
			}
			current = current.parent
		}
		return null
	}

	private fun hasRootMarker(dir: Path): Boolean {
		for (marker in ROOT_MARKERS) {
			val candidate = dir.resolve(marker)
			if (Files.exists(candidate)) {
				return true
			}
		}
		return false
	}

	private fun installDir(): Path {
		return Paths.get(PathManager.getSystemPath(), "ripple-language-server")
	}

	private fun resolveInstalledBinary(installDir: Path): Path? {
		val bin = installDir.resolve(
			"node_modules",
			".bin",
			if (SystemInfo.isWindows) "$LSP_BIN.cmd" else LSP_BIN
		)
		return if (Files.exists(bin)) bin else null
	}

	private fun installedVersion(installDir: Path): String? {
		val packageJson = installDir.resolve(
			"node_modules",
			"@ripple-ts",
			"language-server",
			"package.json",
		)
		if (!Files.isRegularFile(packageJson)) {
			return null
		}
		return try {
			val content = Files.readString(packageJson)
			VERSION_PATTERN.find(content)?.groupValues?.getOrNull(1)
		} catch (ex: Exception) {
			LOG.warn("Failed to read Ripple language server version", ex)
			null
		}
	}

	private fun readRequiredVersion(): String {
		val stream = RippleLanguageServer::class.java.getResourceAsStream(LSP_VERSION_RESOURCE)
		if (stream == null) {
			LOG.warn("Ripple language server version resource not found: $LSP_VERSION_RESOURCE")
			return FALLBACK_VERSION
		}

		return try {
			val version = stream.bufferedReader(Charsets.UTF_8).use { reader ->
				reader.readLine()?.trim().orEmpty()
			}
			version.ifBlank {
				LOG.warn("Ripple language server version resource was empty: $LSP_VERSION_RESOURCE")
				FALLBACK_VERSION
			}
		} catch (ex: Exception) {
			LOG.warn("Failed to read Ripple language server version resource", ex)
			FALLBACK_VERSION
		}
	}

	private fun ensureInstallAsync(project: Project, installDir: Path) {
		val required = requiredVersion
		synchronized(installLock) {
			if (installInProgress) {
				return
			}
			if (resolveInstalledBinary(installDir) != null && installedVersion(installDir) == required) {
				return
			}
			installInProgress = true
		}

			notify(
				project,
				NotificationType.INFORMATION,
				"Ripple",
				"Installing $LSP_PACKAGE@$required for language features...",
			)

		ApplicationManager.getApplication().executeOnPooledThread {
			val success = installServer(project, installDir)
			synchronized(installLock) {
				installInProgress = false
			}

			if (success && !project.isDisposed) {
				notify(
					project,
					NotificationType.INFORMATION,
					"Ripple",
					"Ripple language server installed. Restarting language services...",
				)
				LspServerManager.getInstance(project)
					.stopAndRestartIfNeeded(RippleLspServerSupportProvider::class.java)
			}
		}
	}

	private fun installServer(project: Project, installDir: Path): Boolean {
		val required = requiredVersion
		val npm = findExecutableInPath("npm")
		if (npm == null) {
			notify(
				project,
				NotificationType.ERROR,
				"Ripple",
				"npm was not found on PATH. Install Node.js 18+ to enable Ripple language features.",
			)
			return false
		}

		return try {
			Files.createDirectories(installDir)
			val commandLine = GeneralCommandLine(
				npm.toString(),
				"install",
				"$LSP_PACKAGE@$required",
				"--prefix",
				installDir.toString(),
				"--no-audit",
				"--no-fund",
			)
			commandLine.withParentEnvironmentType(GeneralCommandLine.ParentEnvironmentType.CONSOLE)
			val output = ExecUtil.execAndGetOutput(commandLine)
			if (output.exitCode != 0) {
				notifyInstallError(project, output.stderr + output.stdout)
				return false
			}

			val version = installedVersion(installDir) ?: "unknown"
			if (version != required) {
				notify(
					project,
					NotificationType.ERROR,
					"Ripple",
					"Installed $LSP_PACKAGE@$version but required $required.",
				)
				return false
			}

			if (resolveInstalledBinary(installDir) == null) {
				notify(
					project,
					NotificationType.ERROR,
					"Ripple",
					"Ripple language server install succeeded but the binary was not found.",
				)
				return false
			}

			true
		} catch (ex: Exception) {
			LOG.warn("Failed to install Ripple language server", ex)
			notifyInstallError(project, ex.message ?: "Unknown error")
			false
		}
	}

	private fun findExecutableInPath(name: String): Path? {
		val pathValue = EnvironmentUtil.getValue("PATH") ?: return null
		val candidates = if (SystemInfo.isWindows) {
			listOf("$name.cmd", "$name.exe", "$name.bat", name)
		} else {
			listOf(name)
		}

		for (entry in pathValue.split(File.pathSeparatorChar)) {
			if (entry.isBlank()) {
				continue
			}
			for (candidate in candidates) {
				val path = Paths.get(entry, candidate)
				if (Files.isRegularFile(path)) {
					return path
				}
			}
		}

		return null
	}

	private fun notifyInstallError(project: Project, details: String) {
		val trimmed = trimOutput(details)
		val message = buildString {
			append("npm install failed. ")
			if (trimmed.isNotBlank()) {
				append("\n\n")
				append(trimmed)
			}
		}
		notify(project, NotificationType.ERROR, "Ripple", message)
	}

	private fun trimOutput(output: String, maxLines: Int = 8): String {
		val lines = output.lineSequence().filter { it.isNotBlank() }.toList()
		return lines.takeLast(maxLines).joinToString("\n")
	}

	private fun notify(project: Project, type: NotificationType, title: String, content: String) {
		if (project.isDisposed) {
			return
		}
		NotificationGroupManager.getInstance()
			.getNotificationGroup("Ripple")
			.createNotification(title, content, type)
			.notify(project)
	}
}

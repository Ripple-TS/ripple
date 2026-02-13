package com.ripple_ts.intellij_plugin

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.extensions.PluginId
import org.jetbrains.plugins.textmate.api.TextMateBundleProvider
import java.net.JarURLConnection
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.Comparator

class RippleTextMateBundleProvider : TextMateBundleProvider {
	override fun getBundles(): List<TextMateBundleProvider.PluginBundle> {
		val bundlePath = ensureBundleAvailable() ?: return emptyList()
		return listOf(TextMateBundleProvider.PluginBundle("Ripple", bundlePath))
	}

	private fun ensureBundleAvailable(): Path? {
		cachedBundle?.let { cached ->
			if (Files.isDirectory(cached)) {
				return cached
			}
		}

		synchronized(lock) {
			cachedBundle?.let { cached ->
				if (Files.isDirectory(cached)) {
					return cached
				}
			}

			val cacheRoot = Paths.get(PathManager.getSystemPath(), "ripple-textmate")
			val bundleDir = cacheRoot.resolve("ripple.tmbundle")
			val versionFile = cacheRoot.resolve("version.txt")
			val pluginVersion = pluginVersion()

			if (Files.isDirectory(bundleDir) && Files.isRegularFile(versionFile)) {
				val recorded = runCatching { Files.readString(versionFile) }.getOrNull()
				if (recorded == pluginVersion) {
					cachedBundle = bundleDir
					return bundleDir
				}
			}

			if (Files.exists(bundleDir)) {
				deleteRecursively(bundleDir)
			}

			val extracted = extractBundle(bundleDir)
			if (!extracted) {
				LOG.warn("Failed to extract Ripple TextMate bundle")
				return null
			}

			runCatching {
				Files.createDirectories(cacheRoot)
				Files.writeString(versionFile, pluginVersion)
			}

			cachedBundle = bundleDir
			return bundleDir
		}
	}

	private fun extractBundle(target: Path): Boolean {
		val resourceUrl = javaClass.classLoader.getResource(BUNDLE_RESOURCE_ROOT) ?: return false

		return when (resourceUrl.protocol) {
			"file" -> copyDirectory(Paths.get(resourceUrl.toURI()), target)
			"jar" -> copyFromJar(resourceUrl, target)
			else -> false
		}
	}

	private fun copyDirectory(source: Path, target: Path): Boolean {
		return runCatching {
			Files.walk(source).use { stream ->
				stream.forEach { path ->
					val relative = source.relativize(path)
					val destination = target.resolve(relative)
					if (Files.isDirectory(path)) {
						Files.createDirectories(destination)
					} else {
						Files.createDirectories(destination.parent)
						Files.copy(path, destination, StandardCopyOption.REPLACE_EXISTING)
					}
				}
			}
			true
		}.getOrElse { false }
	}

	private fun copyFromJar(resourceUrl: java.net.URL, target: Path): Boolean {
		return runCatching {
			val connection = resourceUrl.openConnection() as JarURLConnection
			val entryRoot = connection.entryName.trimEnd('/')
			connection.jarFile.use { jar ->
				val entries = jar.entries()
				while (entries.hasMoreElements()) {
					val entry = entries.nextElement()
					if (entry.isDirectory) {
						continue
					}
					if (!entry.name.startsWith("$entryRoot/")) {
						continue
					}
					val relative = entry.name.removePrefix("$entryRoot/")
					val destination = target.resolve(relative)
					Files.createDirectories(destination.parent)
					jar.getInputStream(entry).use { input ->
						Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING)
					}
				}
			}
			true
		}.getOrElse { false }
	}

	private fun deleteRecursively(path: Path) {
		Files.walk(path)
			.sorted(Comparator.reverseOrder())
			.forEach { Files.deleteIfExists(it) }
	}

	private fun pluginVersion(): String {
		val descriptor = PluginManagerCore.getPlugin(PluginId.getId(PLUGIN_ID))
		return descriptor?.version ?: "dev"
	}

	companion object {
		private const val PLUGIN_ID = "com.ripple_ts.intellij_plugin"
		private const val BUNDLE_RESOURCE_ROOT = "textmate/ripple.tmbundle"
		private val LOG = Logger.getInstance(RippleTextMateBundleProvider::class.java)
		private val lock = Any()

		@Volatile
		private var cachedBundle: Path? = null
	}
}

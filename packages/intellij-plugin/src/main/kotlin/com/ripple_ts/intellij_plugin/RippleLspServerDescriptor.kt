package com.ripple_ts.intellij_plugin

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.ProjectWideLspServerDescriptor

internal class RippleLspServerDescriptor(
	project: Project,
	private val serverInfo: RippleLanguageServer.ServerInfo,
) : ProjectWideLspServerDescriptor(project, "Ripple") {
	override fun isSupportedFile(file: VirtualFile): Boolean = RippleFileType.isRippleFile(file)

	override fun createCommandLine(): GeneralCommandLine {
		val commandLine = GeneralCommandLine(serverInfo.binary.toString(), "--stdio")
		serverInfo.root?.let { commandLine.withWorkDirectory(it.toFile()) }
		return commandLine
	}
}

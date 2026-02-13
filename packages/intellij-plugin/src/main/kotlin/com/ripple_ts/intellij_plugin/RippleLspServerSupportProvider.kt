package com.ripple_ts.intellij_plugin

import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.platform.lsp.api.LspServerSupportProvider

class RippleLspServerSupportProvider : LspServerSupportProvider {
	override fun fileOpened(
		project: Project,
		file: VirtualFile,
		serverStarter: LspServerSupportProvider.LspServerStarter,
	) {
		if (!RippleFileType.isRippleFile(file)) {
			return
		}

		val serverInfo = RippleLanguageServer.resolveServer(project, file) ?: return
		serverStarter.ensureServerStarted(RippleLspServerDescriptor(project, serverInfo))
	}
}

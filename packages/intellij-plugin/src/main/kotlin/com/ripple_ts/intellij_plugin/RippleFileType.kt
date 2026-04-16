package com.ripple_ts.intellij_plugin

import com.intellij.openapi.fileTypes.LanguageFileType
import com.intellij.openapi.vfs.VirtualFile
import javax.swing.Icon

class RippleFileType private constructor() : LanguageFileType(RippleLanguage) {
	override fun getName(): String = "Ripple"

	override fun getDescription(): String = "Ripple language file"

	override fun getDefaultExtension(): String = "ripple"

	override fun getIcon(): Icon = RippleIcons.FILE

	companion object {
		@JvmField
		val INSTANCE = RippleFileType()

		private val EXTENSIONS = setOf("ripple", "tsrx")

		fun isRippleFile(file: VirtualFile): Boolean {
			return file.extension?.lowercase() in EXTENSIONS
		}
	}
}

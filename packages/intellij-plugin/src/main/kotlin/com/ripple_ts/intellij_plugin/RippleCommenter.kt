package com.ripple_ts.intellij_plugin

import com.intellij.lang.Commenter

class RippleCommenter : Commenter {
	override fun getLineCommentPrefix(): String = "//"

	override fun getBlockCommentPrefix(): String = "/*"

	override fun getBlockCommentSuffix(): String = "*/"

	override fun getCommentedBlockCommentPrefix(): String? = null

	override fun getCommentedBlockCommentSuffix(): String? = null
}

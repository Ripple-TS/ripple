local M = {}

function M.setup(plugin)
	vim.filetype.add {
		extension = {
			ripple = "ripple",
			tsrx = "ripple",
		},
	}

	require("ripple.treesitter").setup(plugin)
	require("ripple.lsp").setup()
end

return M

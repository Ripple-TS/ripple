local M = {}

function add_ripple()
	require('nvim-treesitter.parsers').ripple = {
		install_info = {
			url = 'https://github.com/Ripple-TS/ripple',
			location = 'grammars/tree-sitter',
		},
		filetype = 'ripple',
	}
end

function M.setup()
	add_ripple()

	vim.api.nvim_create_autocmd('FileType', {
		pattern = { 'ripple' },
		callback = function() pcall(vim.treesitter.start) end,
	})

	vim.api.nvim_create_autocmd('User', {
		pattern = 'TSUpdate',
		callback = add_ripple,
	})
end

return M

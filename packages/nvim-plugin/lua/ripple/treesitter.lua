local M = {}

local function resolve_parser_install_info(plugin)
	if plugin and type(plugin.dir) == 'string' and plugin.dir ~= '' then
		return {
			url = plugin.dir,
			location = 'grammars/tree-sitter',
			files = { 'src/parser.c', 'src/scanner.c' },
		}
	end

	return {
		url = 'https://github.com/Ripple-TS/ripple',
		location = 'grammars/tree-sitter',
		files = { 'src/parser.c', 'src/scanner.c' },
	}
end

local function add_ripple(plugin)
	require('nvim-treesitter.parsers').list.ripple = {
		install_info = resolve_parser_install_info(plugin),
		filetype = 'ripple',
	}

	vim.treesitter.language.register('ripple', 'ripple')
end

function M.setup(plugin)
	add_ripple(plugin)

	vim.api.nvim_create_autocmd('FileType', {
		pattern = { 'ripple' },
		callback = function() pcall(vim.treesitter.start) end,
	})

	vim.api.nvim_create_autocmd('User', {
		pattern = 'TSUpdate',
		callback = function() add_ripple(plugin) end,
	})
end

return M

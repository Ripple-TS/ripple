from __future__ import annotations

import os
from pathlib import Path
import shutil

import sublime
from LSP.plugin import LspPlugin, OnPreStartContext, WorkspaceFolder
from lsp_utils import NodeManager
from sublime_lib import ResourcePath


def plugin_loaded() -> None:
    LspRipplePlugin.register()


def plugin_unloaded() -> None:
    LspRipplePlugin.unregister()


class LspRipplePlugin(LspPlugin):
    @classmethod
    def on_pre_start_async(cls, context: OnPreStartContext) -> None:
        if external_binary := cls._determine_external_binary(context.view, context.workspace_folders):
            context.configuration.command = [external_binary, '--stdio']
        else:
            package_name = cls.plugin_storage_path.name
            NodeManager.on_pre_start_async(
                context,
                cls.plugin_storage_path,
                ResourcePath('Packages', package_name, 'language-server'),
                Path('node_modules', '@ripple-ts', 'language-server', 'bin', 'language-server.js'),
                node_version_requirement='>=18',
            )

    @classmethod
    def _determine_external_binary(
        cls,
        initiating_view: sublime.View,
        workspace_folders: list[WorkspaceFolder]
    ) -> str | None:
        local_binary = cls._find_local_binary(initiating_view, workspace_folders)
        if local_binary:
            return local_binary

        global_binary = cls._find_global_binary()
        if global_binary:
            return global_binary

        return None

    @classmethod
    def _find_local_binary(
        cls,
        initiating_view: sublime.View,
        workspace_folders: list[WorkspaceFolder]
    ) -> str | None:
        script_name = cls._binary_name()
        candidates: list[str] = []

        if file_path := initiating_view.file_name():
            candidates.extend(cls._node_modules_dirs_from_path(file_path))

        for folder in workspace_folders:
            candidates.extend(cls._node_modules_dirs_from_path(folder.path))

        seen = set()
        for node_modules_path in candidates:
            if node_modules_path in seen:
                continue
            seen.add(node_modules_path)

            script_path = os.path.join(node_modules_path, '.bin', script_name)
            windows_script = cls._maybe_windows_script(script_path)

            if windows_script and os.path.isfile(windows_script):
                return windows_script

            if os.path.isfile(script_path):
                return script_path

        return None

    @classmethod
    def _node_modules_dirs_from_path(cls, path: str) -> list[str]:
        if not path:
            return []

        directories: list[str] = []
        current = os.path.abspath(path)

        if os.path.isfile(current):
            current = os.path.dirname(current)

        while True:
            directories.append(os.path.join(current, 'node_modules'))
            parent = os.path.dirname(current)
            if parent == current:
                break
            current = parent

        return directories

    @classmethod
    def _find_global_binary(cls) -> str | None:
        script_name = cls._binary_name()
        for candidate in (script_name, cls._maybe_windows_script(script_name)):
            if candidate:
                if path := shutil.which(candidate):
                    return path
        return None

    @classmethod
    def _binary_name(cls) -> str:
        return 'ripple-language-server'

    @classmethod
    def _maybe_windows_script(cls, script_path: str) -> str | None:
        if script_path and sublime.platform() == 'windows':
            return script_path + '.cmd' if not script_path.endswith('.cmd') else script_path
        return None

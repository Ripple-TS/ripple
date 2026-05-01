use std::env;
use std::fs;
use std::path::PathBuf;

use zed_extension_api::{self as zed, serde_json::{self, Value}, LanguageServerId};

struct TsrxExtension {
    cached_binary_path: Option<PathBuf>,
    required_version: Option<String>,
}

const PACKAGE_NAME: &str = "@ripple-ts/language-server";

impl TsrxExtension {
    fn language_server_binary_path(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<String, String> {
        if let Some(path) = self.cached_binary_path.as_ref() {
            if fs::metadata(path).map_or(false, |stat| stat.is_file()) {
                return Ok(path.to_string_lossy().into_owned());
            }
        }

        if let Some(system_path) = Self::system_binary_path(worktree) {
            self.cached_binary_path = Some(system_path.clone());
            return Ok(system_path.to_string_lossy().into_owned());
        }

        let binary_path = self.install_language_server(language_server_id)?;
        Ok(binary_path.to_string_lossy().into_owned())
    }

    fn system_binary_path(worktree: &zed::Worktree) -> Option<PathBuf> {
        let (os, _) = zed::current_platform();
        let bin_name = match os {
            zed::Os::Windows => "ripple-language-server.cmd",
            _ => "ripple-language-server",
        };

        let root_str = worktree.root_path();
        eprintln!("[ripple-ext] worktree root: {}", root_str);
        let root = PathBuf::from(&root_str);

        // 1. Project-local: if the project's package.json declares
        //    PACKAGE_NAME as a dep, npm/pnpm will have placed a bin wrapper at
        //    node_modules/.bin/<bin_name>. We can't probe inside node_modules
        //    via worktree.read_text_file (Zed excludes it from the indexed
        //    worktree), so we read package.json instead and infer.
        let needle = format!("\"{}\"", PACKAGE_NAME);
        if let Ok(pkg_json) = worktree.read_text_file("package.json") {
            if pkg_json.contains(&needle) {
                let abs = root.join("node_modules").join(".bin").join(bin_name);
                eprintln!("[ripple-ext] using project-local bin: {}", abs.display());
                return Some(abs);
            }
            eprintln!("[ripple-ext] package.json does not declare {}", PACKAGE_NAME);
        } else {
            eprintln!("[ripple-ext] no package.json at worktree root");
        }

        // 2. PATH lookup (for global installs).
        match worktree.which(bin_name) {
            Some(path) => {
                eprintln!("[ripple-ext] which({}) -> {}", bin_name, path);
                Some(PathBuf::from(path))
            }
            None => {
                eprintln!("[ripple-ext] which({}) -> None; falling back to npm install", bin_name);
                None
            }
        }
    }

    fn install_language_server(
        &mut self,
        language_server_id: &LanguageServerId,
    ) -> Result<PathBuf, String> {
        let required_version = self.required_version()?;

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );

        if self.should_install_or_update(&required_version) {
            zed::set_language_server_installation_status(
                language_server_id,
                &zed::LanguageServerInstallationStatus::Downloading,
            );

            if let Err(error) = zed::npm_install_package(PACKAGE_NAME, &required_version) {
                if self
                    .get_installed_version()
                    .as_deref()
                    != Some(required_version.as_str())
                {
                    return Err(error);
                }
            }
        }

        let binary_path = Self::installed_binary_path()
            .map_err(|error| format!("Failed to locate language server binary: {}", error))?;

        self.cached_binary_path = Some(binary_path.clone());

        Ok(binary_path)
    }

    fn should_install_or_update(&self, required_version: &str) -> bool {
        if !Self::binary_exists() {
            return true;
        }

        match self.get_installed_version() {
            Some(installed_version) => installed_version != required_version,
            None => true,
        }
    }

    fn get_installed_version(&self) -> Option<String> {
        zed::npm_package_installed_version(PACKAGE_NAME)
            .ok()
            .flatten()
            .map(|version| version.trim().to_string())
    }

    fn binary_exists() -> bool {
        Self::installed_binary_path().is_ok()
    }

    fn installed_binary_path() -> Result<PathBuf, String> {
        let extension_dir = Self::extension_dir()?;
        let (os, _) = zed::current_platform();

        let binary_name = match os {
            zed::Os::Windows => "ripple-language-server.cmd",
            _ => "ripple-language-server",
        };

        let bin_path = extension_dir
            .join("node_modules")
            .join(".bin")
            .join(binary_name);

        if fs::metadata(&bin_path).map_or(false, |stat| stat.is_file()) {
            return Ok(bin_path);
        }

        // Fallback: parse the installed package's package.json `bin` field
        // and resolve from there. Auto-tracks whatever path the package
        // declares (string form or { "<name>": "<path>" } object form), so
        // this stays correct if the LSP restructures its layout.
        let pkg_dir = extension_dir.join("node_modules").join(PACKAGE_NAME);
        let pkg_json_path = pkg_dir.join("package.json");
        let manifest_fallback = if let Ok(contents) = fs::read_to_string(&pkg_json_path) {
            if let Ok(manifest) = serde_json::from_str::<Value>(&contents) {
                let rel = match manifest.get("bin") {
                    Some(Value::String(s)) => Some(s.as_str().to_owned()),
                    Some(Value::Object(map)) => map
                        .values()
                        .find_map(|v| v.as_str().map(str::to_owned)),
                    _ => None,
                };
                rel.map(|r| pkg_dir.join(r))
            } else {
                None
            }
        } else {
            None
        };

        if let Some(path) = manifest_fallback.as_ref() {
            if fs::metadata(path).map_or(false, |stat| stat.is_file()) {
                return Ok(path.clone());
            }
        }

        let mut tried = format!("{}", bin_path.display());
        if let Some(p) = manifest_fallback {
            tried.push_str(&format!(" or {}", p.display()));
        }
        Err(format!("expected a binary at {}", tried))
    }

    fn extension_dir() -> Result<PathBuf, String> {
        env::current_dir().map_err(|err| err.to_string())
    }

    fn required_version(&mut self) -> Result<String, String> {
        if let Some(version) = self.required_version.clone() {
            return Ok(version);
        }

        let version = Self::read_required_version()?;
        self.required_version = Some(version.clone());
        Ok(version)
    }

    fn read_required_version() -> Result<String, String> {
        let package_json: Value = serde_json::from_str(include_str!("../package.json"))
            .map_err(|error| format!("Failed to parse package.json embedded in extension: {}", error))?;

        let spec = package_json
            .get("config")
            .and_then(|config| config.get(PACKAGE_NAME))
            .and_then(|value| value.as_str())
            .map(str::trim)
            .filter(|spec| !spec.is_empty())
            .ok_or_else(|| {
                format!(
                    "Add config.{PACKAGE_NAME} to package.json to pin the language server version."
                )
            })?;

        if !Self::is_exact_semver(spec) {
            return Err(format!(
                "config.{PACKAGE_NAME} in package.json must be an exact semver (e.g. 0.2.0); got '{}'",
                spec
            ));
        }

        Ok(spec.to_string())
    }

    fn is_exact_semver(spec: &str) -> bool {
        let parts: Vec<&str> = spec.split('.').collect();
        if parts.len() != 3 {
            return false;
        }

        parts
            .iter()
            .all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()))
    }
}

impl zed::Extension for TsrxExtension {
    fn new() -> Self {
        Self {
            cached_binary_path: None,
            required_version: None,
        }
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command, String> {
        let binary_path = self.language_server_binary_path(language_server_id, worktree)?;

        // Wrap the spawn in a shell snippet that prints an actionable error if
        // the bin disappears between detection and exec. Needed because we
        // cannot probe paths under node_modules from inside the wasm sandbox,
        // so the project-local path returned by system_binary_path is a guess
        // (we trust package.json + that the user ran their package manager).
        // If the guess is wrong, this gives the user a clear message and
        // recovery steps instead of a bare OS-level "no such file" error.
        let (os, _) = zed::current_platform();
        let mut env = worktree.shell_env();
        env.push(("RIPPLE_LSP_BIN".into(), binary_path.clone()));
        env.push(("RIPPLE_LSP_PKG".into(), PACKAGE_NAME.into()));

        let cmd = match os {
            zed::Os::Windows => zed::Command {
                command: "cmd".into(),
                args: vec![
                    "/c".into(),
                    "if exist \"%RIPPLE_LSP_BIN%\" ( \
                       \"%RIPPLE_LSP_BIN%\" --stdio \
                     ) else ( \
                       echo [ripple-language-server] not found at \"%RIPPLE_LSP_BIN%\". \
Run `pnpm install` ^(or `npm install`^) in your project, \
or remove \"%RIPPLE_LSP_PKG%\" from your dependencies to use the auto-installed version. 1>&2 \
                       & exit /b 127 \
                     )".into(),
                ],
                env,
            },
            _ => zed::Command {
                command: "/bin/sh".into(),
                args: vec![
                    "-c".into(),
                    "if [ -x \"$RIPPLE_LSP_BIN\" ]; then \
                       exec \"$RIPPLE_LSP_BIN\" --stdio; \
                     else \
                       printf '%s\\n' \
                         \"[ripple-language-server] not found at $RIPPLE_LSP_BIN. \
Run \\`pnpm install\\` (or \\`npm install\\`) in your project, \
or remove \\\"$RIPPLE_LSP_PKG\\\" from your dependencies to use the auto-installed version.\" >&2; \
                       exit 127; \
                     fi".into(),
                ],
                env,
            },
        };

        Ok(cmd)
    }
}

zed::register_extension!(TsrxExtension);

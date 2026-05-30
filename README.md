# FEDDA Hub v15

FEDDA Hub v15 is the slim distribution branch for a workflow-first local AI studio.

## v15 scope

The v15 UI intentionally focuses on five areas:

- Image Studio
- Video Studio
- Gallery, with images and videos together
- LoRA & Character
- Ollama Models

Agent Chat, Audio/SFX, old workflow playgrounds, logs UI, and experimental menu branches are excluded from the v15 navigation for now.

## Install layout

For local staging this project is expected to live under:

```text
H:\Fedda-Hub\Fedda_hub_v15\
  install\
    FEDDA_v15_Installer.bat
    app\                 # local runtime install target, ignored by git
  repo\
    Fedda_hub_v15\       # git working tree for this repository
```

The single-file installer clones or updates:

```text
https://github.com/Feddakalkun/Fedda_hub_v15
```

into `install\app`, then runs `scripts\install.bat LITE`.

## Runtime policy

Runtime and generated assets are not committed:

- `ComfyUI/`
- `python_embeded/`
- `venv/`
- `node_modules/`
- `ollama_embeded/`
- model folders and model binaries
- cache, logs, temp, output folders

The installer bootstraps those locally.

## Development checks

From the repo folder:

```powershell
cd H:\Fedda-Hub\Fedda_hub_v15\repo\Fedda_hub_v15
.\scripts\smoke_clean_install.ps1
cd frontend
npm.cmd run build
```

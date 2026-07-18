# Métodos alternativos e históricos

Este documento conserva las dos soluciones que precedieron a **Chat Zoom Controls**. Son alternativas útiles para experimentar o para controlar el tamaño del chat sin instalar esta extensión, pero no son los métodos recomendados para el uso diario.

Los ejemplos mantienen la configuración que dio origen a la extensión:

- Tamaño mínimo del chat: `12`
- Tamaño máximo del chat: `16`
- Incremento o decremento: `0.5`
- Valor de restablecimiento: `13`
- Tamaño del código: tamaño del chat `+ 1`
- Aumentar: `Ctrl+Alt+Numpad +`
- Disminuir: `Ctrl+Alt+Numpad -`
- Restablecer: `Ctrl+Alt+Numpad *`

> **Importante:** usa solamente uno de estos métodos a la vez. Si **Chat Zoom Controls** está instalada y habilitada, sus atajos predeterminados entrarán en conflicto con los ejemplos de este documento.

## Método 1: Settings Cycler

[Settings Cycler](https://marketplace.visualstudio.com/items?itemName=hoovercj.vscode-settings-cycler) permite crear comandos que recorren una lista de valores de configuración.

Instálala desde VS Code o con:

```powershell
code --install-extension hoovercj.vscode-settings-cycler
```

### Configuración

Agrega lo siguiente a tu archivo de configuración de usuario `settings.json`:

```jsonc
{
  "chat.fontSize": 13,
  "chat.editor.fontSize": 14,
  "settings.cycle": [
    {
      "id": "chatFontSizeIncrease",
      "overrideWorkspaceSettings": false,
      "values": [
        { "chat.fontSize": 12, "chat.editor.fontSize": 13 },
        { "chat.fontSize": 12.5, "chat.editor.fontSize": 13.5 },
        { "chat.fontSize": 13, "chat.editor.fontSize": 14 },
        { "chat.fontSize": 13.5, "chat.editor.fontSize": 14.5 },
        { "chat.fontSize": 14, "chat.editor.fontSize": 15 },
        { "chat.fontSize": 14.5, "chat.editor.fontSize": 15.5 },
        { "chat.fontSize": 15, "chat.editor.fontSize": 16 },
        { "chat.fontSize": 15.5, "chat.editor.fontSize": 16.5 },
        { "chat.fontSize": 16, "chat.editor.fontSize": 17 }
      ]
    },
    {
      "id": "chatFontSizeDecrease",
      "overrideWorkspaceSettings": false,
      "values": [
        { "chat.fontSize": 16, "chat.editor.fontSize": 17 },
        { "chat.fontSize": 15.5, "chat.editor.fontSize": 16.5 },
        { "chat.fontSize": 15, "chat.editor.fontSize": 16 },
        { "chat.fontSize": 14.5, "chat.editor.fontSize": 15.5 },
        { "chat.fontSize": 14, "chat.editor.fontSize": 15 },
        { "chat.fontSize": 13.5, "chat.editor.fontSize": 14.5 },
        { "chat.fontSize": 13, "chat.editor.fontSize": 14 },
        { "chat.fontSize": 12.5, "chat.editor.fontSize": 13.5 },
        { "chat.fontSize": 12, "chat.editor.fontSize": 13 }
      ]
    },
    {
      "id": "chatFontSizeReset",
      "overrideWorkspaceSettings": false,
      "values": [
        { "chat.fontSize": 13, "chat.editor.fontSize": 14 }
      ]
    }
  ]
}
```

Si tu `settings.json` ya contiene otras opciones, agrega solamente las propiedades mostradas y respeta las comas del objeto existente.

Después agrega estos atajos a `keybindings.json`:

```jsonc
[
  {
    "key": "ctrl+alt+numpad_add",
    "command": "settings.cycle.chatFontSizeIncrease"
  },
  {
    "key": "ctrl+alt+numpad_subtract",
    "command": "settings.cycle.chatFontSizeDecrease"
  },
  {
    "key": "ctrl+alt+numpad_multiply",
    "command": "settings.cycle.chatFontSizeReset"
  }
]
```

En macOS, sustituye `ctrl` por `cmd` si deseas reproducir los atajos predeterminados de la extensión.

### Ventajas

- No requiere escribir ni ejecutar scripts.
- Actualiza `chat.fontSize` y `chat.editor.fontSize` juntos.
- Permite cambiar fácilmente la lista de valores.

### Limitación que motivó el siguiente método

Los comandos de aumento y disminución tienen identificadores distintos. Settings Cycler mantiene el estado de cada ciclo por separado, en vez de calcular el siguiente valor a partir de `chat.fontSize` en cada pulsación. Al alternar rápidamente entre ambos comandos, el tamaño puede saltar a un valor inesperado.

## Método 2: script de PowerShell

El segundo enfoque lee el valor actual de `chat.fontSize`, calcula el siguiente valor y escribe de nuevo ambos ajustes. De esta manera, aumentar y disminuir parten siempre del mismo estado real.

Este ejemplo está pensado para **Windows y la edición estable de VS Code**. Antes de usarlo:

1. Deshabilita **Chat Zoom Controls** y Settings Cycler para evitar conflictos.
2. Elimina cualquier bloque anterior de `settings.cycle` que contenga `chat.fontSize`.
3. Verifica que `settings.json` contenga exactamente una aparición de cada ajuste:

   ```jsonc
   "chat.fontSize": 13,
   "chat.editor.fontSize": 14
   ```

### Script

Crea un archivo llamado `change-chat-font-size.ps1` en la ubicación que prefieras:

```powershell
param(
  [ValidateSet("up", "down", "reset")]
  [string]$Mode = "reset"
)

$settingsPath = Join-Path $env:APPDATA "Code\User\settings.json"
$text = Get-Content -Raw $settingsPath

$chatPattern = '"chat\.fontSize"\s*:\s*([0-9]+(?:\.[0-9]+)?)'
$codePattern = '"chat\.editor\.fontSize"\s*:\s*([0-9]+(?:\.[0-9]+)?)'

$chatMatches = [regex]::Matches($text, $chatPattern)
$codeMatches = [regex]::Matches($text, $codePattern)

if ($chatMatches.Count -ne 1) {
  throw "settings.json debe contener exactamente una aparición de chat.fontSize."
}

if ($codeMatches.Count -ne 1) {
  throw "settings.json debe contener exactamente una aparición de chat.editor.fontSize."
}

$current = [double]$chatMatches[0].Groups[1].Value

switch ($Mode) {
  "up"    { $next = [Math]::Min(16.0, $current + 0.5) }
  "down"  { $next = [Math]::Max(12.0, $current - 0.5) }
  "reset" { $next = 13.0 }
}

$next = [Math]::Round($next * 2) / 2
$nextCode = $next + 1

$culture = [System.Globalization.CultureInfo]::InvariantCulture
$nextText = $next.ToString("0.##", $culture)
$nextCodeText = $nextCode.ToString("0.##", $culture)

$text = [regex]::Replace(
  $text,
  $chatPattern,
  '"chat.fontSize": ' + $nextText,
  1
)
$text = [regex]::Replace(
  $text,
  $codePattern,
  '"chat.editor.fontSize": ' + $nextCodeText,
  1
)

[System.IO.File]::WriteAllText(
  $settingsPath,
  $text,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host (
  "Tamaño aplicado: chat.fontSize={0} | chat.editor.fontSize={1}" -f `
    $nextText,
    $nextCodeText
)
```

El uso de `16.0` y `12.0` es intencional: obliga a PowerShell a conservar valores decimales al seleccionar la sobrecarga de `Math.Min` o `Math.Max`.

### Tareas de VS Code

Crea o modifica el archivo de usuario `tasks.json` mediante **Tasks: Open User Tasks**. Sustituye `<RUTA_RELATIVA_AL_SCRIPT>` por la ruta bajo tu perfil de usuario donde guardaste el script:

```jsonc
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Chat Font: Increase",
      "type": "process",
      "command": "powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${env:USERPROFILE}\\<RUTA_RELATIVA_AL_SCRIPT>\\change-chat-font-size.ps1",
        "-Mode",
        "up"
      ],
      "problemMatcher": [],
      "presentation": {
        "reveal": "never",
        "panel": "shared",
        "showReuseMessage": false
      }
    },
    {
      "label": "Chat Font: Decrease",
      "type": "process",
      "command": "powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${env:USERPROFILE}\\<RUTA_RELATIVA_AL_SCRIPT>\\change-chat-font-size.ps1",
        "-Mode",
        "down"
      ],
      "problemMatcher": [],
      "presentation": {
        "reveal": "never",
        "panel": "shared",
        "showReuseMessage": false
      }
    },
    {
      "label": "Chat Font: Reset",
      "type": "process",
      "command": "powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "${env:USERPROFILE}\\<RUTA_RELATIVA_AL_SCRIPT>\\change-chat-font-size.ps1",
        "-Mode",
        "reset"
      ],
      "problemMatcher": [],
      "presentation": {
        "reveal": "never",
        "panel": "shared",
        "showReuseMessage": false
      }
    }
  ]
}
```

También puedes usar una ruta absoluta. En JSON, cada barra invertida debe escribirse dos veces; por ejemplo, `C:\\<RUTA>\\change-chat-font-size.ps1`.

### Atajos para las tareas

Agrega lo siguiente a `keybindings.json`:

```jsonc
[
  {
    "key": "ctrl+alt+numpad_add",
    "command": "workbench.action.tasks.runTask",
    "args": "Chat Font: Increase"
  },
  {
    "key": "ctrl+alt+numpad_subtract",
    "command": "workbench.action.tasks.runTask",
    "args": "Chat Font: Decrease"
  },
  {
    "key": "ctrl+alt+numpad_multiply",
    "command": "workbench.action.tasks.runTask",
    "args": "Chat Font: Reset"
  }
]
```

### Ventajas

- Cada acción parte del valor actual de `chat.fontSize`.
- Conserva límites estrictos sin volver al inicio de una lista.
- No depende de otra extensión de VS Code.

### Limitaciones

- Cada pulsación inicia un proceso de PowerShell y una tarea de VS Code.
- El inicio del proceso introduce una demora perceptible frente a una extensión nativa.
- El script modifica `settings.json` como texto y, por seguridad, exige una sola aparición de cada clave.
- La ruta predeterminada corresponde a VS Code estable. Otras ediciones pueden guardar sus ajustes en una carpeta diferente.

## Por qué se creó esta extensión

**Chat Zoom Controls** conserva el cálculo basado en el valor actual del script, pero usa directamente la API de configuración de VS Code:

- No analiza ni reescribe `settings.json` manualmente.
- No inicia procesos externos ni tareas.
- Serializa pulsaciones rápidas para evitar lecturas obsoletas.
- Mantiene sincronizados el texto normal y los bloques de código.
- Ofrece límites, paso, restablecimiento y offset configurables.

Estos dos métodos se mantienen aquí como referencia técnica y como registro de la evolución de la solución.
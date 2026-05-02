import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

// peon-ping extension for pi coding-agent
// Plays sound notifications when AI agent events occur

interface Sound {
  file: string;
  label: string;
  sha256: string;
}

interface Category {
  sounds: Sound[];
}

interface PackManifest {
  cesp_version: string;
  name: string;
  display_name: string;
  categories: Record<string, Category>;
}

interface Config {
  volume?: number;
  default_pack?: string;
  active_pack?: string;
  enabled?: boolean;
}

const PEON_DIR = `${process.env.HOME}/.openpeon`;
const CONFIG_PATH = `${PEON_DIR}/config.json`;

// Track last played sound per category to avoid repeats
const lastPlayed: Record<string, string> = {};

async function loadConfig(): Promise<Config> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return { volume: 0.5, default_pack: "peon", enabled: true };
  }
}

async function loadManifest(packName: string): Promise<PackManifest | null> {
  try {
    const manifestPath = join(PEON_DIR, "packs", packName, "openpeon.json");
    const content = await readFile(manifestPath, "utf-8");
    return JSON.parse(content);
  } catch {
    try {
      // Fallback to manifest.json
      const manifestPath = join(PEON_DIR, "packs", packName, "manifest.json");
      const content = await readFile(manifestPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

function getRandomSound(sounds: Sound[]): Sound {
  return sounds[Math.floor(Math.random() * sounds.length)];
}

function getRandomSoundNoRepeat(sounds: Sound[], category: string): Sound {
  if (sounds.length <= 1) return sounds[0];
  
  let sound: Sound;
  do {
    sound = sounds[Math.floor(Math.random() * sounds.length)];
  } while (sound.file === lastPlayed[category]);
  
  lastPlayed[category] = sound.file;
  return sound;
}

async function playSound(category: string, ctx: ExtensionContext, enabled: boolean) {
  if (!enabled) return;

  try {
    const config = await loadConfig();
    if (config.enabled === false) return;

    const packName = config.default_pack || config.active_pack || "peon";
    const volume = config.volume ?? 0.5;

    const manifest = await loadManifest(packName);
    if (!manifest) {
      console.error(`[peon-ping] Pack "${packName}" not found`);
      return;
    }

    const catData = manifest.categories[category];
    if (!catData?.sounds?.length) {
      // Category not available in this pack, skip silently
      return;
    }

    const sound = getRandomSoundNoRepeat(catData.sounds, category);
    const soundPath = join(PEON_DIR, "packs", packName, sound.file);

    // Only macOS supported for now
    if (process.platform !== "darwin") return;

    // Spawn detached process so sound continues even if pi exits
    const child = spawn("afplay", ["-v", String(volume), soundPath], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch (error) {
    console.error(`[peon-ping] Error playing sound:`, error);
  }
}

export default function (pi: ExtensionAPI) {
  // Track if sounds are enabled for this session
  let sessionEnabled = true;

  // Session start - "Ready to work?"
  pi.on("session_start", async (_event, ctx) => {
    await playSound("session.start", ctx, sessionEnabled);
  });

  // Agent starts working - "I read you." / "On it."
  pi.on("agent_start", async (_event, ctx) => {
    await playSound("task.acknowledge", ctx, sessionEnabled);
  });

  // Agent finishes - "Work, work." / "Job's done!"
  pi.on("agent_end", async (_event, ctx) => {
    await playSound("task.complete", ctx, sessionEnabled);
  });

  // Tool execution errors are intentionally silent
  pi.on("tool_execution_end", async (_event, _ctx) => {
    // no-op
  });

  // Register toggle command
  pi.registerCommand("peon-toggle", {
    description: "Toggle peon-ping sounds on/off",
    handler: async (_args, ctx) => {
      sessionEnabled = !sessionEnabled;
      ctx.ui.notify(`peon-ping ${sessionEnabled ? "enabled" : "disabled"}`, sessionEnabled ? "success" : "warning");
    },
  });

  // Register status command
  pi.registerCommand("peon-status", {
    description: "Check peon-ping status",
    handler: async (_args, ctx) => {
      const config = await loadConfig();
      const packName = config.default_pack || config.active_pack || "peon";
      ctx.ui.notify(`peon-ping: ${sessionEnabled ? "enabled" : "disabled"} | pack: ${packName} | volume: ${config.volume ?? 0.5}`, "info");
    },
  });

  // Register test command to preview sounds
  pi.registerCommand("peon-test", {
    description: "Test peon-ping sounds",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Testing peon-ping sounds (one each)...", "info");
      
      const categories = ["session.start", "task.acknowledge", "task.complete", "task.error"];
      for (const cat of categories) {
        await playSound(cat, ctx, true);
        await new Promise(r => setTimeout(r, 1500)); // Wait between sounds
      }
    },
  });
}
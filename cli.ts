import { Command } from "jsr:@cliffy/command@^1.0.0-rc.8";
import { exists } from "jsr:@std/fs";

const ModuleFiles = [
  "fetchers.ts",
  "mod.ts",
  "mod_test.ts",
  "request_builders.ts",
  "requests.ts",
  "response_handlers.ts",
  "types.ts",
  "validation.ts",
];

const newModule = new Command()
  .description("Generpte directory and files for a new SJVAir SDK module")
  .arguments("<moduleName:string>")
  .action(async (_, modulePath) => {
    const destination = `${import.meta.dirname}/lib/${modulePath}`;

    if (await exists(destination)) {
      console.error(`Error: Module "${modulePath}" already exists`);
      Deno.exit(1);
    }

    await Deno.mkdir(destination, { recursive: true });

    for (const file of ModuleFiles) {
      const path = `${destination}/${file}`;
      await Deno.create(path);
    }
  });

export const modManager = new Command()
  .description("SDK Module Utilities")
  .command("create", newModule);

const commands = new Command()
  .command("module", modManager);

await commands.parse(Deno.args);

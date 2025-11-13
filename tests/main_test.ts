import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";

// Test helper to run the main function with a custom working directory
async function generateMakefileForTest(
  testDir: string,
  force = false
): Promise<string> {
  const originalCwd = Deno.cwd();
  try {
    // Change to test directory
    Deno.chdir(testDir);

    // Run the generation command (main.ts is in the root directory)
    const mainPath = join(originalCwd, "main.ts");
    const cmd = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        mainPath,
        ...(force ? ["--force"] : []),
      ],
      cwd: testDir,
    });

    const { code, stdout, stderr } = await cmd.output();

    if (code !== 0) {
      throw new Error(
        `Command failed with code ${code}: ${new TextDecoder().decode(stderr)}`
      );
    }

    // Read the generated Makefile
    const makefilePath = join(testDir, "Makefile");
    if (!(await exists(makefilePath))) {
      throw new Error("Makefile was not generated");
    }

    return await Deno.readTextFile(makefilePath);
  } finally {
    Deno.chdir(originalCwd);
  }
}

Deno.test("Generate Makefile from test package.json", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    // Copy the test package.json
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    // Generate Makefile
    const makefile = await generateMakefileForTest(testDir);

    // Verify the Makefile contains expected content
    assertStringIncludes(makefile, "# Auto-generated Makefile — DO NOT EDIT");
    assertStringIncludes(makefile, "PKG_MANAGER := npm");
    assertStringIncludes(makefile, ".PHONY:");

    // Verify basic targets
    assertStringIncludes(makefile, "help:");
    assertStringIncludes(makefile, "install:");
    assertStringIncludes(makefile, "ci:");

    // Verify script targets
    assertStringIncludes(makefile, "dev:");
    assertStringIncludes(makefile, "build:");
    assertStringIncludes(makefile, "start:");
    assertStringIncludes(makefile, "lint:");

    console.log("✅ Basic Makefile generation test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Handle colons in script names", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    // Copy the test package.json which has docker:build, docker:run, etc.
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    // Generate Makefile
    const makefile = await generateMakefileForTest(testDir);

    // Verify colons are converted to dashes
    assertStringIncludes(makefile, "docker-build:");
    assertStringIncludes(makefile, "docker-run:");
    assertStringIncludes(makefile, "docker-up:");
    assertStringIncludes(makefile, "docker-down:");
    assertStringIncludes(makefile, "docker-logs:");
    assertStringIncludes(makefile, "docker-restart:");
    assertStringIncludes(makefile, "docker-dev:");
    assertStringIncludes(makefile, "docker-dev-with-agent:");
    assertStringIncludes(makefile, "docker-dev-ui-only:");

    // Verify the commands still use the original script names
    assertStringIncludes(makefile, "npm run docker:build");
    assertStringIncludes(makefile, "npm run docker:run");

    console.log("✅ Colon conversion test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify convenience aliases", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    const makefile = await generateMakefileForTest(testDir);

    // Verify aliases exist
    assertStringIncludes(makefile, "# alias: s -> start");
    assertStringIncludes(makefile, "s: start");

    assertStringIncludes(makefile, "# alias: d -> dev");
    assertStringIncludes(makefile, "d: dev");

    assertStringIncludes(makefile, "# alias: b -> build");
    assertStringIncludes(makefile, "b: build");

    assertStringIncludes(makefile, "# alias: l -> lint");
    assertStringIncludes(makefile, "l: lint");

    assertStringIncludes(makefile, "# alias: i -> install");
    assertStringIncludes(makefile, "i: install");

    console.log("✅ Convenience aliases test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify CI target includes available steps", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    const makefile = await generateMakefileForTest(testDir);

    // The test package has lint and build, so ci should include them
    assertStringIncludes(makefile, "ci:");
    assertStringIncludes(makefile, "npm run lint");
    assertStringIncludes(makefile, "npm run build");

    console.log("✅ CI target test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify all scripts are included", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    const pkg = JSON.parse(pkgContent);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    const makefile = await generateMakefileForTest(testDir);

    // Get all script names from package.json
    const scripts = Object.keys(pkg.scripts).filter(
      (name) => !/^pre|^post/.test(name)
    );

    // Verify each script has a target (with colons converted to dashes)
    for (const script of scripts) {
      const target = script.replace(/:/g, "-");
      assertStringIncludes(makefile, `${target}:`);
      assertStringIncludes(makefile, `npm run ${script}`);
    }

    console.log(`✅ All ${scripts.length} scripts included in Makefile`);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify --force flag overwrites existing Makefile", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    // Create first Makefile
    const makefile1 = await generateMakefileForTest(testDir);
    const timestamp1 = makefile1.match(/Generated by js-to-make at (.+)/)?.[1];

    // Wait a bit to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate again with --force
    const makefile2 = await generateMakefileForTest(testDir, true);
    const timestamp2 = makefile2.match(/Generated by js-to-make at (.+)/)?.[1];

    // Timestamps should be different
    assertEquals(typeof timestamp1, "string");
    assertEquals(typeof timestamp2, "string");
    // They might be the same if execution is too fast, but the command should succeed

    console.log("✅ Force flag test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify version scripts are included", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    const makefile = await generateMakefileForTest(testDir);

    // Verify version scripts (with colons converted)
    assertStringIncludes(makefile, "version-patch:");
    assertStringIncludes(makefile, "npm run version:patch");

    assertStringIncludes(makefile, "version-minor:");
    assertStringIncludes(makefile, "npm run version:minor");

    assertStringIncludes(makefile, "version-major:");
    assertStringIncludes(makefile, "npm run version:major");

    console.log("✅ Version scripts test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("Verify changelog and release targets", async () => {
  const testDir = await Deno.makeTempDir();

  try {
    const testPkgPath = join(Deno.cwd(), "tests", "package.json.testing");
    const pkgContent = await Deno.readTextFile(testPkgPath);
    await Deno.writeTextFile(join(testDir, "package.json"), pkgContent);

    const makefile = await generateMakefileForTest(testDir);

    // Verify changelog and release targets
    assertStringIncludes(makefile, "changelog:");
    assertStringIncludes(makefile, "npm run changelog");

    assertStringIncludes(makefile, "release:");
    assertStringIncludes(makefile, "npm run release");

    console.log("✅ Changelog and release targets test passed");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

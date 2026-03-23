import { closeE2EPrisma, resetAndSeedCoreUsers } from "../helpers/db";

async function main() {
  await resetAndSeedCoreUsers();
  await closeE2EPrisma();
  console.info("E2E 测试库已完成 reset，并写入核心测试用户。");
}

main().catch(async (error) => {
  console.error(error);
  await closeE2EPrisma();
  process.exitCode = 1;
});

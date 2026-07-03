/* Runs once when a server instance wakes. The only guest is the
   schema healer, so a deploy that carries new tables lands them
   itself and db:push stops being anyone's errand. */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { healSchema } = await import("./db/heal");
    await healSchema();
  }
}

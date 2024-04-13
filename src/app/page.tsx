import { dbClient } from "@/lib/db/db";
import { usersTable } from "@/lib/db/schema";

export default async function Home() {

  const data = await dbClient.select().from(usersTable);
  console.log(data)
  return (
    <div>Most recent topics</div>
  );
}
  
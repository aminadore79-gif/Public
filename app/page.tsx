import PromptUI from "./prompt-ui";
import { listPrompts } from "./actions/prompt-actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPrompts = await listPrompts();
  return <PromptUI initialPrompts={initialPrompts} />;
}


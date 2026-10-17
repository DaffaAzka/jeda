import { prisma } from "../../lib/prisma";
import { contentToLexicalJson } from "../../lib/editor/tiptap-to-lexical";
import { validateLexicalState } from "../../lib/editor/validate-lexical";

async function main() {
  console.log("Starting migration of question stems, explanations, and option bodies to Lexical JSON...");

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      stem: true,
      explanation: true,
    },
  });

  console.log(`Found ${questions.length} questions to check.`);
  let questionsUpdated = 0;

  for (const q of questions) {
    const lexicalStem = contentToLexicalJson(q.stem);
    validateLexicalState(lexicalStem);

    const lexicalExplanation = contentToLexicalJson(q.explanation);
    validateLexicalState(lexicalExplanation);

    const stemStr = JSON.stringify(lexicalStem);
    const explStr = JSON.stringify(lexicalExplanation);

    if (stemStr !== q.stem || explStr !== q.explanation) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          stem: stemStr,
          explanation: explStr,
        },
      });
      questionsUpdated++;
    }
  }

  const options = await prisma.questionOption.findMany({
    select: {
      id: true,
      body: true,
    },
  });

  console.log(`Found ${options.length} question options to check.`);
  let optionsUpdated = 0;

  for (const opt of options) {
    const lexicalBody = contentToLexicalJson(opt.body);
    validateLexicalState(lexicalBody);

    const bodyStr = JSON.stringify(lexicalBody);

    if (bodyStr !== opt.body) {
      await prisma.questionOption.update({
        where: { id: opt.id },
        data: {
          body: bodyStr,
        },
      });
      optionsUpdated++;
    }
  }

  console.log(`Migration complete! Updated ${questionsUpdated} questions and ${optionsUpdated} options to Lexical JSON.`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

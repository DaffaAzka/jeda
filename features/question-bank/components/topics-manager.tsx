"use client";

import { deleteTopic, saveTopic } from "@/features/question-bank/actions";
import type { TopicManagerData } from "@/features/question-bank/queries";
import { siteCopy } from "@/lib/copy/id";
import { CrudModal } from "./crud-modal";
import { DeleteButton } from "./delete-button";
import { MutationForm } from "./mutation-form";

const copy = siteCopy.questionBank;

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold">
      <span>{label}</span>
      <input
        className="min-h-10 w-full border-2 border-border bg-background px-3 font-normal focus:outline-none focus:ring-2 focus:ring-link"
        defaultValue={defaultValue}
        maxLength={150}
        name={name}
        required
        type="text"
      />
    </label>
  );
}

function SubtestSelect({
  subtests,
  defaultValue,
}: {
  subtests: TopicManagerData["subtests"];
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold">
      <span>{copy.parentSubtest}</span>
      <select
        className="min-h-10 w-full border-2 border-border bg-background px-3 font-normal focus:outline-none focus:ring-2 focus:ring-link"
        defaultValue={defaultValue}
        name="subtestId"
      >
        {subtests.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TopicForm({
  topic,
  subtests,
  defaultSubtestId,
  onClose,
}: {
  topic?: TopicManagerData["topics"][number];
  subtests: TopicManagerData["subtests"];
  defaultSubtestId: string;
  onClose: () => void;
}) {
  return (
    <MutationForm
      action={saveTopic}
      buttonLabel={topic ? copy.editTopic : copy.addTopic}
      className="space-y-4"
      onSuccess={onClose}
    >
      {topic && <input name="id" type="hidden" value={topic.id} />}
      <SubtestSelect
        defaultValue={topic?.subtestId ?? defaultSubtestId}
        subtests={subtests}
      />
      <Field
        defaultValue={topic?.name ?? ""}
        label={copy.name}
        name="name"
      />
    </MutationForm>
  );
}

export function TopicsManager({
  topics,
  subtests,
}: {
  topics: TopicManagerData["topics"];
  subtests: TopicManagerData["subtests"];
}) {
  const defaultSubtestId = subtests[0]?.id ?? "";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {topics.length} {copy.topics.toLowerCase()}
        </p>
        {subtests.length > 0 ? (
          <CrudModal title={copy.addTopic} triggerLabel={`+ ${copy.addTopic}`}>
            {(onClose) => (
              <TopicForm
                defaultSubtestId={defaultSubtestId}
                onClose={onClose}
                subtests={subtests}
              />
            )}
          </CrudModal>
        ) : null}
      </div>

      {/* Empty states */}
      {subtests.length === 0 ? (
        <p className="mt-4 border-2 border-border bg-muted p-4 text-sm">
          {copy.emptySubtests}
        </p>
      ) : topics.length === 0 ? (
        <p className="mt-4 border-2 border-border bg-muted p-4 text-sm">
          {copy.emptyTopics}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto border-2 border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted">
                <th className="px-4 py-3 text-left font-semibold">
                  {copy.subtests}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {copy.name}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {copy.questions}
                </th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border bg-card">
              {topics.map((topic) => (
                <tr className="hover:bg-muted/40" key={topic.id}>
                  <td className="px-4 py-3 text-muted-foreground">
                    {topic.subtestName}
                  </td>
                  <td className="px-4 py-3 font-medium">{topic.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {topic.questionCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <CrudModal
                        title={copy.editTopic}
                        triggerClassName="inline-flex min-h-9 items-center border-2 border-border px-3 text-xs font-semibold hover:bg-muted"
                        triggerLabel={copy.edit}
                      >
                        {(onClose) => (
                          <TopicForm
                            defaultSubtestId={topic.subtestId}
                            onClose={onClose}
                            subtests={subtests}
                            topic={topic}
                          />
                        )}
                      </CrudModal>
                      <DeleteButton action={deleteTopic} id={topic.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

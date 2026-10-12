"use client";

import { deleteSubtest, saveSubtest } from "@/features/question-bank/actions";
import { siteCopy } from "@/lib/copy/id";
import { CrudModal } from "./crud-modal";
import { DeleteButton } from "./delete-button";
import { MutationForm } from "./mutation-form";

const copy = siteCopy.questionBank;

type SubtestRow = {
  id: string;
  code: string;
  name: string;
  defaultSeconds: number;
  _count: { topics: number };
};

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: "text" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold">
      <span>{label}</span>
      <input
        className="min-h-10 w-full border-2 border-border bg-background px-3 font-normal focus:outline-none focus:ring-2 focus:ring-link"
        defaultValue={defaultValue}
        max={max}
        maxLength={type === "text" ? 150 : undefined}
        min={min}
        name={name}
        required
        type={type}
      />
    </label>
  );
}

function SubtestForm({
  subtest,
  onClose,
}: {
  subtest?: SubtestRow;
  onClose: () => void;
}) {
  return (
    <MutationForm
      action={saveSubtest}
      buttonLabel={subtest ? copy.editSubtest : copy.addSubtest}
      className="space-y-4"
      onSuccess={onClose}
    >
      {subtest && <input name="id" type="hidden" value={subtest.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          defaultValue={subtest?.code ?? ""}
          label={copy.code}
          name="code"
        />
        <Field
          defaultValue={subtest?.name ?? ""}
          label={copy.name}
          name="name"
        />
        <Field
          defaultValue={subtest?.defaultSeconds ?? 1800}
          label={copy.defaultSeconds}
          max={7200}
          min={30}
          name="defaultSeconds"
          type="number"
        />
      </div>
    </MutationForm>
  );
}

export function SubtestsManager({ subtests }: { subtests: SubtestRow[] }) {
  return (
    <div>
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {subtests.length} {copy.subtests.toLowerCase()}
        </p>
        <CrudModal title={copy.addSubtest} triggerLabel={`+ ${copy.addSubtest}`}>
          {(onClose) => <SubtestForm onClose={onClose} />}
        </CrudModal>
      </div>

      {/* Table */}
      {subtests.length === 0 ? (
        <p className="mt-4 border-2 border-border bg-muted p-4 text-sm">
          {copy.emptySubtests}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto border-2 border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-muted">
                <th className="px-4 py-3 text-left font-semibold">
                  {copy.code}
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {copy.name}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {copy.defaultSeconds}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {copy.topics}
                </th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border bg-card">
              {subtests.map((subtest) => (
                <tr className="hover:bg-muted/40" key={subtest.id}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold tracking-wider">
                    {subtest.code}
                  </td>
                  <td className="px-4 py-3 font-medium">{subtest.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {subtest.defaultSeconds}s
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {subtest._count.topics}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <CrudModal
                        title={copy.editSubtest}
                        triggerClassName="inline-flex min-h-9 items-center border-2 border-border px-3 text-xs font-semibold hover:bg-muted"
                        triggerLabel={copy.edit}
                      >
                        {(onClose) => (
                          <SubtestForm onClose={onClose} subtest={subtest} />
                        )}
                      </CrudModal>
                      <DeleteButton action={deleteSubtest} id={subtest.id} />
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

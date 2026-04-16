import { config } from "@/lib/config";
import { fetchTableData } from "@/lib/fetch-table-data";
import { loadDescription } from "@/lib/load-description";
import { validateEntries } from "@/lib/validate-entries";
import { logValidationIssues } from "@/lib/log-validation";
import { TableView } from "@/components/TableView";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default async function Page() {
  const entries = await fetchTableData();
  const result = validateEntries(entries, config.columns);
  logValidationIssues(result);
  const descriptionHtml = loadDescription();

  return (
    <div>
      <header className="navbar bg-base-200">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">{config.name}</span>
        </div>
        <div className="flex-none px-4">
          <ThemeSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {descriptionHtml ? (
          <div className="alert mb-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          </div>
        ) : config.siteDescription ? (
          <div className="alert mb-6">
            <p>{config.siteDescription}</p>
          </div>
        ) : null}

        <TableView
          entries={entries}
          symbol={config.symbol}
          levelOrder={config.levelOrder}
          columns={config.columns}
        />
      </main>
    </div>
  );
}

import { config } from "@/lib/config";
import { fetchTableData } from "@/lib/fetch-table-data";
import { loadDescription } from "@/lib/load-description";
import { validateEntries } from "@/lib/validate-entries";
import { ValidationLogger } from "@/components/ValidationLogger";
import { TableView } from "@/components/TableView";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default async function Page() {
  const entries = await fetchTableData();
  const result = validateEntries(entries, config.columns);
  const descriptionHtml = loadDescription();

  const descriptionContent = descriptionHtml
    ? <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
    : config.siteDescription
    ? <p>{config.siteDescription}</p>
    : null;

  return (
    <>
      <ValidationLogger issues={result.issues} totalEntries={entries.length} />
      <header className="navbar bg-base-200">
        <div className="flex-1">
          <span className="text-xl font-bold px-4">{config.name}</span>
        </div>
        <div className="flex-none px-4">
          <ThemeSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {descriptionContent && (
          <div className="alert mb-6">{descriptionContent}</div>
        )}

        <div className="overflow-x-auto">
          <TableView
            entries={entries}
            symbol={config.symbol}
            levelOrder={config.levelOrder}
            columns={config.columns}
          />
        </div>
      </main>
    </>
  );
}

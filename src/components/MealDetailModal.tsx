import Modal from './Modal';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  mealLabel?: string;        // kategoria posiłku
  ingredients?: string;      // tekst przecinkowy → lista punktowana
  notes?: string;            // notatka / przepis
  dateLabel?: string;        // data posiłku z planu (gotowy tekst)
  onAddToDay?: () => void;   // baza: dodanie do wybranego dnia
  onEdit?: () => void;
  onDelete?: () => void;
  onSaveToBase?: () => void; // plan: zapis w bazie posiłków
  inBase?: boolean;          // plan: posiłek jest już w bazie
}

// rozbij przecinkowy / średnikowy / wieloliniowy tekst na listę punktów
// przecinek przed cyfrą nie rozdziela (polskie liczby dziesiętne: "2,5 łyżki")
function splitIngredients(text: string): string[] {
  return text
    .split(/[\n;]+|,(?!\d)/)
    .map(part => part.trim())
    .filter(Boolean);
}

export default function MealDetailModal({
  isOpen,
  onClose,
  name,
  mealLabel,
  ingredients,
  notes,
  dateLabel,
  onAddToDay,
  onEdit,
  onDelete,
  onSaveToBase,
  inBase,
}: MealDetailModalProps) {
  const ingredientList = splitIngredients(ingredients || '');
  const hasNotes = !!(notes && notes.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={name}>
      <div className="space-y-4">
        {/* Kategoria i data */}
        {(mealLabel || dateLabel) && (
          <div className="flex flex-wrap items-center gap-2">
            {mealLabel && (
              <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
                {mealLabel}
              </span>
            )}
            {dateLabel && (
              <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                📅 {dateLabel}
              </span>
            )}
          </div>
        )}

        {/* Składniki — pełna lista, bez obcinania */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            🧺 Składniki
          </h4>
          {ingredientList.length > 0 ? (
            <ul className="space-y-1.5">
              {ingredientList.map((ingredient, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-800 leading-relaxed">
                  <span className="text-orange-400 flex-shrink-0">•</span>
                  <span className="break-words">{ingredient}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Brak składników</p>
          )}
        </section>

        {/* Notatka / przepis — pełny tekst */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            📝 Notatka / przepis
          </h4>
          {hasNotes ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {notes}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Brak notatki</p>
          )}
        </section>

        {/* Akcje */}
        <div className="flex flex-wrap gap-2 pt-1">
          {onAddToDay && (
            <button
              type="button"
              onClick={onAddToDay}
              className="flex-1 min-w-[130px] bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              Dodaj do dnia
            </button>
          )}

          {onSaveToBase && (
            inBase ? (
              <span className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1 bg-orange-100 text-orange-700 py-2.5 rounded-xl text-sm font-semibold">
                ⭐ W bazie
              </span>
            ) : (
              <button
                type="button"
                onClick={onSaveToBase}
                className="flex-1 min-w-[130px] bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                ⭐ Zapisz w bazie
              </button>
            )
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 min-w-[110px] bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              ✏️ Edytuj
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 min-w-[110px] bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
            >
              🗑 Usuń
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

# gdwiki: brainstorm and decision record

Version: 0.1.0

## 1. Frame

Задача: спроектировать Wiki-модуль Metaproject как Markdown-first базу знаний проекта, которая помогает человеку и агенту быстро находить архитектуру, доменные модели, бизнес-правила, пользовательские сценарии, компоненты, сервисы, интеграции и known decisions.

Ограничения:

- стек проекта: TypeScript/Bun;
- Wiki должна жить локально внутри `.metaproject`;
- агент не должен читать всю базу знаний целиком;
- структура должна быть версионируемой в Git;
- runtime/generated индексы не должны засорять Git;
- модуль должен интегрироваться с `gdgraph` и `gdctx`.

## 2. Interviewer Decisions

На основании уже заданного контекста приняты следующие решения:

| Question | Decision | Confidence |
|---|---|---|
| Где должна жить Wiki? | В `.metaproject/wiki/` как agent-facing и human-readable knowledge base. | certain |
| Основной формат? | Markdown. | certain |
| Нужны ли CLI-команды? | Да: создание страниц, проверка ссылок, генерация индекса. | certain |
| Нужно ли UI? | Нет для MVP. | certain |
| Нужно ли версионирование документов? | Да, поле `Version` обязательно для всех requirements-документов и wiki-шаблонов. | certain |
| Нужны ли связи с кодом? | Да, через `gdgraph` references и frontmatter/link metadata. | assumption |
| Нужны ли embeddings/vector search в MVP? | Нет, только структура, индекс и link validation. | assumption |

Открытые вопросы:

- Нужна ли будущая синхронизация Wiki с внешними системами вроде Confluence/Notion?
- Должны ли wiki-страницы иметь owners/status?
- Нужно ли автоматически предлагать создание wiki-страниц из `gdgraph` module-map?

## 3. Options

### Option A: Minimal Markdown Wiki

Approach: создать папки, шаблоны, `index.md`, CLI для `new`, `index`, `check-links`.

Pros:

- быстро реализовать;
- легко версионировать;
- понятно человеку и агенту;
- низкий риск.

Cons:

- нет глубокого поиска;
- связи с кодом только вручную или через простые references;
- нет автоматического knowledge extraction.

Effort: S  
Risk: Low

### Option B: Markdown Wiki + Graph References

Approach: Markdown-first Wiki плюс обязательные поля metadata, references на `gdgraph` nodes/files/modules, индекс связей и проверка битых ссылок.

Pros:

- хорошая навигация для агента;
- можно связывать бизнес-логику с кодом;
- поддерживает будущий search/graph overlay;
- остается простым и Git-friendly.

Cons:

- сложнее шаблоны;
- нужно аккуратно определить metadata schema;
- часть ссылок потребует ручной дисциплины.

Effort: M  
Risk: Medium

### Option C: Semantic Knowledge Base

Approach: Markdown + embeddings/vector index + semantic search + automatic summarization.

Pros:

- сильный поиск;
- лучше масштабируется на большие базы знаний;
- можно делать agent Q&A по Wiki.

Cons:

- нужен storage и возможно API;
- выше complexity;
- сложнее privacy/offline mode;
- рано для MVP.

Effort: L  
Risk: High

## 4. Comparison Matrix

| Criteria | Option A | Option B | Option C |
|---|---:|---:|---:|
| Time to MVP | Fast | Medium | Slow |
| Agent usefulness | Medium | High | High |
| Human readability | High | High | Medium |
| Git friendliness | High | High | Medium |
| Future extensibility | Medium | High | High |
| Operational risk | Low | Medium | High |

## 5. Recommendation

Recommended: Option B - Markdown Wiki + Graph References.

Reasoning:

- сохраняет простую Markdown-first модель;
- дает агентам структурированные entrypoints;
- позволяет связывать документацию с кодом через `gdgraph`;
- не требует embeddings/API в MVP;
- оставляет путь к semantic search позже.

Runner-up: Option A, если нужно сделать самый быстрый MVP без graph references.

Option C стоит отложить до появления реального объема Wiki и понимания search-потребностей.

## 6. Next Steps

1. Реализовать `gdwiki` init scaffold.
2. Создать `.metaproject/wiki/index.md`.
3. Добавить шаблоны страниц.
4. Добавить CLI:
   - `gd-metapro wiki new <type> <slug>`;
   - `gd-metapro wiki index`;
   - `gd-metapro wiki check-links`.
5. Добавить skill `.metaproject/skills/gdwiki/SKILL.md`.
6. Добавить manifest `.metaproject/modules/gdwiki.md`.

# Verification Examples

Real-world examples of proper verification workflows that prevent false claims.

## Example 1: MJML Email Templates

### Initial Assumption (Wrong)
"Email templates use plain HTML instead of MJML. Need to migrate."

### Verification Process

**Step 1: Search for MJML files**
```bash
$ find services/ -name "*.mjml"
services/alert-engine/templates/breaking-alert.mjml
services/alert-engine/templates/daily-digest.mjml
services/alert-engine/templates/weekly-digest.mjml
```

**Step 2: Read template file**
```bash
$ Read("services/alert-engine/templates/breaking-alert.mjml")
```

**Found:**
```xml
<mjml>
  <mj-head>
    <mj-title>BREAKING: {{article.title}}</mj-title>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#7f1d1d">
      <mj-column>
        <mj-text>pew.news</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

**Step 3: Verify compilation**
```bash
$ grep -r "mjml2html" services/alert-engine/
services/alert-engine/src/delivery/templates.ts:import mjml2html from 'mjml';
services/alert-engine/src/delivery/templates.ts:  const { html, errors } = mjml2html(mjmlSource);
```

**Step 4: Read implementation code**
```typescript
// services/alert-engine/src/delivery/templates.ts:59
const { html, errors } = mjml2html(mjmlSource, {
  validationLevel: 'soft',
});

if (errors.length > 0) {
  logger.warn({ templateName, errors }, 'MJML compilation warnings');
}

const template = Handlebars.compile(html);
```

### Corrected Conclusion

✅ **MJML fully implemented**
- 6 templates with real MJML syntax
- Complete compilation pipeline
- Handlebars integration
- Template caching
- Exceeds documented specification (3 templates)

### Lesson

File extension alone (.mjml) doesn't prove implementation. Must read file contents and verify compilation code.

---

## Example 2: Bloom Filter Deduplication

### Initial Assumption (Ambiguous)
"Comments mention Bloom filter but unclear if implemented."

### Verification Process

**Step 1: Search for Bloom references**
```bash
$ grep -r "Bloom\|bloom" services/ingest/internal/dedup/
services/ingest/internal/dedup/dedup.go:// Tier 1: URL Bloom filter (exact URL match)
services/ingest/internal/dedup/dedup.go:// RebuildFromDB rebuilds the URL Bloom filter from the database
services/ingest/internal/dedup/dedup.go:    log.Info().Msg("Rebuilt Bloom filter from database")
```

**Step 2: Read actual implementation**
```go
// services/ingest/internal/dedup/dedup.go:45
func (d *DedupEngine) CheckURLExists(url string) (bool, error) {
    // Comment says "Bloom filter" but implementation is:
    var exists bool
    err := d.db.QueryRow(context.Background(),
        "SELECT EXISTS(SELECT 1 FROM articles WHERE source_url = $1)",
        url,
    ).Scan(&exists)
    return exists, err
}
```

**Step 3: Check for Bloom filter imports**
```bash
$ grep -r "bloom" services/ingest/internal/dedup/dedup.go
# Only in comments, no import statement
```

**Step 4: Check data structures**
```go
type DedupEngine struct {
    db    *pgxpool.Pool
    // No bloom filter field
}
```

### Conclusion

⚠️ **Bloom filter NOT implemented, using direct PostgreSQL queries**
- Comments reference Bloom filter (intended design)
- Actual implementation uses direct DB queries
- Works functionally but slower at scale
- Should migrate at 100k+ articles

### Lesson

Comments can describe intended implementation, not actual implementation. Always verify the actual code logic.

---

## Example 3: Email Service Provider

### Initial Assumption (Wrong)
"Documentation says SendGrid, so email is not implemented since no SendGrid found."

### Verification Process

**Step 1: Search for documented provider**
```bash
$ grep -r "sendgrid\|SendGrid" services/
# No results
```

**Step 2: Search for alternatives**
```bash
$ grep -r "RESEND\|Resend" services/
services/alert-engine/src/delivery/templates.ts:import { Resend } from 'resend';
services/api/src/routes/email-events.ts:// Resend webhook handler
```

**Step 3: Read implementation**
```typescript
// services/alert-engine/src/delivery/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: 'alerts@pew.news',
    to,
    subject,
    html,
  });

  return { data, error };
}
```

**Step 4: Check .env.example**
```bash
$ grep "EMAIL\|RESEND" .env.example
RESEND_API_KEY=
EMAIL_FROM=alerts@pew.news
```

### Conclusion

✅ **Email implemented with Resend (alternative provider)**
- Documentation specified SendGrid
- Implementation uses Resend instead
- Strategic choice: better free tier, simpler API
- Fully functional, better than documented approach

### Lesson

Missing the documented implementation doesn't mean feature is missing. Check for alternative implementations before claiming something is absent.

---

## Example 4: Search System

### Documentation
"Use Meilisearch for typo-tolerant search"

### Verification Process

**Step 1: Search for Meilisearch**
```bash
$ grep -r "meilisearch\|Meilisearch" services/
# No results

$ docker-compose ps | grep meilisearch
# No container
```

**Step 2: Search for search implementation**
```bash
$ grep -r "search" services/api/src/routes/
services/api/src/routes/search.ts
```

**Step 3: Read search implementation**
```typescript
// services/api/src/routes/search.ts
const query = sql`
  SELECT * FROM articles
  WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
  ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) DESC
  LIMIT ${limit}
`;
```

**Step 4: Check database schema**
```sql
-- init-db/002-schema.sql
ALTER TABLE articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title,'')), 'A') ||
    setweight(to_tsvector('english', COALESCE(summary,'')), 'B')
  ) STORED;

CREATE INDEX idx_articles_search ON articles
  USING gin(search_vector);
```

### Conclusion

⚠️ **Alternative implementation: PostgreSQL full-text search**
- Meilisearch NOT implemented
- Using PostgreSQL FTS instead
- Pros: Simpler, no separate service
- Cons: No typo tolerance, slower at scale
- Should migrate at 10k+ visitors/month

### Lesson

When documented tool is missing, check database schema and queries for alternative approaches.

---

## Example 5: Scheduled Jobs

### Documentation
"Dedicated scheduler service handles all cron jobs"

### Verification Process

**Step 1: Check for scheduler service**
```bash
$ ls -la services/scheduler/
# Directory doesn't exist

$ docker-compose ps | grep scheduler
# No scheduler container
```

**Step 2: Search for cron/scheduling**
```bash
$ grep -r "cron\|schedule" services/ --include="*.go" --include="*.ts"
services/ingest/internal/scheduler/scheduler.go
services/analytics/src/engines/scheduler.ts
```

**Step 3: Read distributed implementations**
```go
// services/ingest/internal/scheduler/scheduler.go
func (s *Scheduler) Start() {
    s.cron.AddFunc("*/15 * * * *", s.pollRSSFeeds)
    s.cron.AddFunc("*/15 * * * *", s.pollGDELT)
    s.cron.Start()
}
```

```typescript
// services/analytics/src/engines/scheduler.ts
cron.schedule('0 */6 * * *', async () => {
    await aggregateFairUseMetrics();
});
```

### Conclusion

⚠️ **Distributed scheduling (not centralized service)**
- No dedicated scheduler service
- Jobs spread across 3+ services
- Functional but harder to monitor
- Missing: email digest jobs

### Lesson

When documented service doesn't exist, search for the functionality distributed across other services.

---

## Quick Reference: Verification Patterns

### Pattern 1: Check Comments vs Code

```
1. Find comment saying "X implementation"
2. Read actual code below comment
3. Verify code matches comment
4. Check imports for required packages
```

### Pattern 2: Alternative Implementation

```
1. Search for documented approach → Not found
2. Search for the functionality itself
3. Find alternative implementation
4. Compare trade-offs
5. Document as "Alternative" not "Missing"
```

### Pattern 3: Progressive Search

```
1. Search for exact package/tool name
2. If not found, search for functionality
3. If not found, search for related terms
4. Check database schema for persistence layer
5. Check environment variables for configuration
```

### Pattern 4: Multi-File Verification

```
1. Find file that should contain feature
2. Read entire file (not just snippets)
3. Check imports at top
4. Verify functions are called, not just defined
5. Check for test files
6. Verify with docker-compose.yml or equivalent
```

## Common False Negatives (Missed Implementations)

### False Negative 1: Different File Location
- Look in: `services/api/`
- Actually in: `services/web/`

### False Negative 2: Different Naming
- Look for: `email-service.ts`
- Actually: `delivery/mailer.ts`

### False Negative 3: Embedded in Another Service
- Look for: Dedicated scheduler service
- Actually: Scheduling in ingest, analytics, etc.

### False Negative 4: Runtime vs Build Time
- Look for: Compiled templates in dist/
- Actually: Templates compiled at runtime

## Evidence Quality Standards

### Level 1: Weak Evidence
```markdown
"I couldn't find X, so it's probably not there."
```

### Level 2: Moderate Evidence
```markdown
"Searched for X with grep, no results found."
```

### Level 3: Strong Evidence
```markdown
"Searched with grep -r 'X' services/ → No results
Searched alternative names (Y, Z) → No results
Checked docker-compose.yml → Service not present
Conclusion: X is not implemented"
```

### Level 4: Complete Evidence (Best)
```markdown
## Feature X Status: ✅ Implemented

**Search performed:**
- `find services/ -name "*feature-x*"` → Found 3 files
- `grep -r "import.*FeatureX" services/` → 12 imports

**Files verified:**
- `services/api/src/feature-x/index.ts:1-150` (full read)
- Implementation confirmed at line 45: `new FeatureX()`
- Tests exist: `services/api/tests/feature-x.test.ts`
- Configuration: `.env.example:23` has `FEATURE_X_ENABLED=true`

**Evidence:**
```typescript
// services/api/src/feature-x/index.ts:45
const featureX = new FeatureX({
  enabled: config.featureX.enabled,
  options: config.featureX.options,
});
```
```

Use Level 4 evidence for all claims.

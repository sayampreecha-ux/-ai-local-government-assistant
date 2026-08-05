# GovPrompt Thailand v7 Architecture

## Request Flow

User Input
→ Shared Context
→ Intent Router
→ Knowledge Search
→ Search Ranking
→ Evidence Pack
→ Reasoning Engine
→ Quality Gate
→ Output Renderer

## Engine Contracts

### 1. Shared Context
ข้อมูลมาตรฐาน: organizationType, owningUnit, domain, currentStage, transactionType, fundingSource, facts, documents, specialFlags, desiredOutput

### 2. Intent Router
Input: user text + context
Output:
- primaryModule
- secondaryModules[]
- intent
- confidence
- reasons[]
- clarificationNeeded

### 3. Knowledge Search
Input: query, modules, context, filters
Output: SearchResult[]

SearchResult fields:
- id
- title
- sourceType
- issuingAuthority
- documentNumber
- issuedDate
- effectiveDate
- status
- jurisdiction
- moduleTags[]
- keywords[]
- textChunk
- sourceUrl
- filePath
- checksum

### 4. Search Ranking
คะแนนแนะนำ:
- semantic relevance 35%
- keyword/phrase match 20%
- authority 15%
- effective status 15%
- recency 10%
- context/module match 5%

ห้ามถือว่าเอกสารใหม่กว่าถูกต้องกว่าเสมอ ต้องตรวจสถานะการใช้บังคับและความสัมพันธ์ระหว่างกฎหมายแม่บท/ระเบียบ/หนังสือสั่งการ

### 5. Evidence Pack
- facts[]
- authorities[]
- conditions[]
- exceptions[]
- conflicts[]
- missingInformation[]
- citations[]

### 6. Reasoning Engine
สร้างผลวิเคราะห์โดยแยก:
- ข้อเท็จจริง
- ประเด็น
- ฐานอำนาจ
- การปรับบทกับข้อเท็จจริง
- ความเสี่ยง
- ทางเลือก
- ข้อเสนอแนะ

### 7. Quality Gate
Checks:
- pdpa
- unsupportedClaims
- missingCitations
- staleSources
- conflictingSources
- incompleteFacts
- confidence

ผลลัพธ์: pass | pass_with_warning | block

## Knowledge Base Structure

knowledge/
- laws/
- regulations/
- circulars/
- rulings/
- court-decisions/
- manuals/
- faq/
- templates/
- local-documents/
- uploaded-documents/

## Metadata Minimum
ทุกเอกสารควรมี:
- title
- sourceType
- issuingAuthority
- issuedDate
- effectiveDate
- status: active | amended | repealed | unknown
- supersedes[]
- supersededBy[]
- moduleTags[]
- jurisdiction
- sourceUrl หรือ filePath
- verifiedAt

## Safety Rules
- Uploaded documents have priority for facts of the case, not automatically for legal authority.
- Legal conclusions require authoritative evidence.
- Unknown status must be disclosed.
- Conflicting sources must be shown, not silently selected.
- Personal data unnecessary to the task must be masked or omitted.

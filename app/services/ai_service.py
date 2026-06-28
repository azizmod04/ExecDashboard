import json
import httpx
from typing import Optional
from app.config import settings


class AIService:
    def __init__(self):
        self.openai_key = settings.openai_api_key
        self.anthropic_key = settings.anthropic_api_key
        self.qwen_key = settings.qwen_api_key

    def is_configured(self) -> bool:
        return bool(self.openai_key or self.anthropic_key or self.qwen_key)

    async def analyze(
        self,
        data: list[dict],
        columns: list[dict],
        kpis: list[dict] | None = None,
        lang: str = "ar",
    ) -> dict:
        if self.openai_key:
            return await self._analyze_openai(data, columns, kpis, lang)
        elif self.anthropic_key:
            return await self._analyze_anthropic(data, columns, kpis, lang)
        elif self.qwen_key:
            return await self._analyze_qwen(data, columns, kpis, lang)
        else:
            return self._fallback_analysis(data, columns, kpis)

    async def ask_question(
        self,
        question: str,
        data: list[dict],
        columns: list[dict],
        context: Optional[str] = None,
        lang: str = "ar",
    ) -> str:
        if self.openai_key:
            return await self._ask_openai(question, data, columns, context, lang)
        elif self.anthropic_key:
            return await self._ask_anthropic(question, data, columns, context, lang)
        elif self.qwen_key:
            return await self._ask_qwen(question, data, columns, context, lang)
        else:
            return self._fallback_answer(question)

    async def _analyze_openai(
        self, data, columns, kpis, lang
    ) -> dict:
        system_prompt = (
            "You are an executive data analyst. Analyze the provided data and return a JSON with these fields: "
            "executive_summary (string), key_trends (array of strings), kpi_analysis (array of objects with name/status/reason), "
            "risks (array of objects with title/severity/description), opportunities (array of objects with title/potential/action), "
            "anomalies (array of strings), recommendations (array of objects with priority/title/description). "
            "Respond ONLY with valid JSON."
            if lang == "en" else
            "أنت محلل بيانات تنفيذي خبير. حلل البيانات المقدمة وأرجع JSON يحتوي على: "
            "executive_summary (نص), key_trends (مصفوفة نصوص), kpi_analysis (مصفوفة objects مع name/status/reason), "
            "risks (مصفوفة objects مع title/severity/description), opportunities (مصفوفة objects مع title/potential/action), "
            "anomalies (مصفوفة نصوص), recommendations (مصفوفة objects مع priority/title/description). "
            "أرجع JSON فقط."
        )

        prompt = self._build_analysis_prompt(data, columns, kpis, lang)

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 3000,
                },
            )
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            return self._parse_analysis_json(content)

    async def _analyze_anthropic(self, data, columns, kpis, lang) -> dict:
        prompt = self._build_analysis_prompt(data, columns, kpis, lang)
        system = (
            "You are an executive data analyst. Return ONLY valid JSON."
            if lang == "en" else
            "أنت محلل بيانات تنفيذي. أرجع JSON فقط."
        )

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 3000,
                    "system": system,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            result = resp.json()
            content = result["content"][0]["text"]
            return self._parse_analysis_json(content)

    async def _analyze_qwen(self, data, columns, kpis, lang) -> dict:
        prompt = self._build_analysis_prompt(data, columns, kpis, lang)
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.qwen_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-plus",
                    "messages": [
                        {"role": "system", "content": "أنت محلل بيانات تنفيذي خبير. أرجع JSON فقط." if lang == "ar" else "You are an executive data analyst. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 3000,
                },
            )
            result = resp.json()
            content = result["choices"][0]["message"]["content"]
            return self._parse_analysis_json(content)

    def _build_analysis_prompt(self, data, columns, kpis, lang) -> str:
        sample = data[:20] if len(data) > 20 else data
        kpi_text = json.dumps(kpis, ensure_ascii=False) if kpis else "None defined"

        if lang == "ar":
            return f"""حلل البيانات التالية كمحلل تنفيذي:

الأعمدة: {json.dumps([c["name"] for c in columns], ensure_ascii=False)}
إجمالي الصفوف: {len(data)}
KPIs: {kpi_text}

عينة البيانات (أول {len(sample)} صف):
{json.dumps(sample, ensure_ascii=False, indent=2)}

قم بتحليل شامل يشمل:
1. ملخص تنفيذي
2. الاتجاهات الرئيسية
3. تحليل KPIs
4. المخاطر
5. الفرص
6. الحالات الشاذة
7. توصيات استراتيجية"""
        else:
            return f"""Analyze this data as an executive analyst:

Columns: {json.dumps([c["name"] for c in columns])}
Total rows: {len(data)}
KPIs: {kpi_text}

Sample data (first {len(sample)} rows):
{json.dumps(sample, indent=2)}

Provide comprehensive analysis including:
1. Executive summary
2. Key trends
3. KPI analysis
4. Risks
5. Opportunities
6. Anomalies
7. Strategic recommendations"""

    def _parse_analysis_json(self, content: str) -> dict:
        try:
            # Try to extract JSON from the response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except:
            pass
        return self._fallback_analysis([], [], [])

    async def _ask_openai(self, question, data, columns, context, lang) -> str:
        sample = data[:30]
        system = (
            "You are a data analyst AI assistant. Answer questions based ONLY on the provided data. "
            "Be precise and quantitative. If the data doesn't contain the answer, say so."
            if lang == "en" else
            "أنت مساعد محلل بيانات. أجب على الأسئلة بناءً على البيانات المقدمة فقط. "
            "كن دقيقاً وكمياً. إذا كانت البيانات لا تحتوي على الإجابة، فقل ذلك."
        )

        prompt = f"""Data columns: {json.dumps([c["name"] for c in columns])}
Data sample ({len(sample)} rows): {json.dumps(sample, ensure_ascii=False, indent=2)}
{ f"Context: {context}" if context else ""}

Question: {question}

Answer concisely and professionally in {"English" if lang == "en" else "Arabic"}."""

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1000,
                },
            )
            return resp.json()["choices"][0]["message"]["content"]

    async def _ask_anthropic(self, question, data, columns, context, lang) -> str:
        sample = data[:30]
        prompt = f"""Data columns: {json.dumps([c["name"] for c in columns])}
Data sample ({len(sample)} rows): {json.dumps(sample, indent=2)}
{ f"Context: {context}" if context else ""}

Question: {question}

Answer concisely and professionally in {"English" if lang == "en" else "Arabic"}."""

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1000,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            return resp.json()["content"][0]["text"]

    async def _ask_qwen(self, question, data, columns, context, lang) -> str:
        sample = data[:30]
        prompt = f"""Data columns: {json.dumps([c["name"] for c in columns])}
Data sample ({len(sample)} rows): {json.dumps(sample, ensure_ascii=False, indent=2)}
{ f"Context: {context}" if context else ""}

Question: {question}

Answer concisely and professionally in {"English" if lang == "en" else "Arabic"}."""
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.qwen_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-plus",
                    "messages": [
                        {"role": "system", "content": "أنت محلل بيانات خبير." if lang == "ar" else "You are an expert data analyst."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1000,
                },
            )
            return resp.json()["choices"][0]["message"]["content"]

    def _fallback_analysis(self, data, columns, kpis) -> dict:
        numeric_cols = [c for c in columns if c.get("type") == "numeric"]
        values = []
        for col in numeric_cols:
            col_values = [
                float(row[col["name"]])
                for row in data
                if row.get(col["name"]) and str(row[col["name"]]).replace(".", "").replace("-", "").isdigit()
            ]
            if col_values:
                values.append({
                    "column": col["name"],
                    "avg": sum(col_values) / len(col_values),
                    "max": max(col_values),
                    "min": min(col_values),
                    "total": sum(col_values),
                })

        return {
            "executive_summary": f"Analysis complete. Found {len(data)} rows across {len(columns)} columns. "
                                 f"Identified {len(numeric_cols)} numeric metrics. "
                                 + ("Configure an AI API key for deeper analysis."
                                    if not self.is_configured()
                                    else ""),
            "key_trends": [f"Column '{c['name']}' has numeric data" for c in numeric_cols[:5]],
            "kpi_analysis": [
                {
                    "name": kpi.get("name", "KPI"),
                    "status": "pending",
                    "reason": "Configure AI for automated KPI analysis",
                }
                for kpi in (kpis or [])
            ],
            "risks": [{"title": "AI not configured", "severity": "medium",
                       "description": "Add an AI API key for automated risk detection"}],
            "opportunities": [{"title": "Enable AI Analysis", "potential": "High",
                              "action": "Configure OpenAI or Anthropic API key in settings"}],
            "anomalies": ["Enable AI for anomaly detection"],
            "recommendations": [{"priority": "high", "title": "Configure AI",
                                "description": "Add API key for AI-powered insights"}],
        }

    def _fallback_answer(self, question: str) -> str:
        return (
            "I need an AI API key configured to answer your question. "
            "Please add your OpenAI or Anthropic API key in settings."
        )


ai_service = AIService()

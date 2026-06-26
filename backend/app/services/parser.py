import pandas as pd
import json
import zipfile
import io
import xml.etree.ElementTree as ET
from typing import Any
from app.config import settings


class FileParser:
    @staticmethod
    async def parse(file_bytes: bytes, filename: str) -> dict:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext in ("xlsx", "xls"):
            return await FileParser._parse_excel(file_bytes, ext)
        elif ext == "csv":
            return await FileParser._parse_csv(file_bytes)
        elif ext == "pbix":
            return await FileParser._parse_powerbi(file_bytes)
        elif ext in ("twb", "twbx"):
            return await FileParser._parse_tableau(file_bytes, ext)
        else:
            raise ValueError(f"Unsupported format: .{ext}")

    @staticmethod
    async def _parse_excel(file_bytes: bytes, ext: str) -> dict:
        engine = "openpyxl" if ext == "xlsx" else "xlrd"
        dfs = pd.read_excel(
            io.BytesIO(file_bytes),
            sheet_name=None,
            engine=engine,
            dtype=str
        )
        return FileParser._dataframes_to_result(dfs, "excel")

    @staticmethod
    async def _parse_csv(file_bytes: bytes) -> dict:
        content = file_bytes.decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(content), dtype=str)
        return FileParser._dataframes_to_result({"Sheet1": df}, "csv")

    @staticmethod
    async def _parse_powerbi(file_bytes: bytes) -> dict:
        result = {"type": "powerbi", "sheets": [], "data": {}, "metadata": {}}
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                if "DataModelSchema" in z.namelist():
                    schema = json.loads(z.read("DataModelSchema"))
                    result["metadata"]["schema"] = schema
                    tables = schema.get("model", {}).get("tables", [])
                    for t in tables:
                        name = t.get("name", "Unknown")
                        cols = [c.get("name") for c in t.get("columns", [])]
                        measures = [
                            {"name": m.get("name"), "expression": m.get("expression")}
                            for m in t.get("measures", [])
                        ]
                        result["sheets"].append(name)
                        result["data"][name] = {
                            "columns": [{"name": c, "type": "numeric"} for c in cols],
                            "measures": measures,
                            "rows": [],
                            "totalRows": 0,
                            "totalCols": len(cols),
                        }

                report_files = [f for f in z.namelist() if f.startswith("Report/") and f.endswith(".json")]
                for rf in report_files:
                    try:
                        result["metadata"][rf] = json.loads(z.read(rf))
                    except:
                        pass
        except zipfile.BadZipFile:
            result["metadata"]["error"] = "Not a valid .pbix (ZIP) file"
        return result

    @staticmethod
    async def _parse_tableau(file_bytes: bytes, ext: str) -> dict:
        result = {"type": "tableau", "sheets": [], "data": {}, "metadata": {}}
        xml_content = file_bytes.decode("utf-8", errors="replace")

        if ext == "twbx":
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                    twb_files = [f for f in z.namelist() if f.endswith(".twb")]
                    if twb_files:
                        xml_content = z.read(twb_files[0]).decode("utf-8", errors="replace")
                    result["metadata"]["extracts"] = [
                        f for f in z.namelist()
                        if f.endswith(".tde") or f.endswith(".hyper")
                    ]
            except zipfile.BadZipFile:
                pass

        try:
            root = ET.fromstring(xml_content)
            for ds in root.iter("datasource"):
                name = ds.get("name", "Datasource")
                cols = []
                for col in ds.iter("column"):
                    cols.append({
                        "name": col.get("name") or col.get("caption") or "unknown",
                        "type": col.get("type", "string"),
                        "role": col.get("role", ""),
                    })
                connections = []
                for conn in ds.iter("connection"):
                    connections.append({
                        "dbname": conn.get("dbname", ""),
                        "server": conn.get("server", ""),
                        "table": conn.get("table", ""),
                    })
                result["sheets"].append(name)
                result["data"][name] = {
                    "columns": [
                        {"name": c["name"], "type": "numeric" if c["type"] in ("integer", "real") else "string"}
                        for c in cols
                    ],
                    "connections": connections,
                    "rows": [],
                    "totalRows": 0,
                    "totalCols": len(cols),
                }

            result["metadata"]["worksheets"] = [
                ws.get("name") for ws in root.iter("worksheet")
            ]
        except ET.ParseError as e:
            result["metadata"]["error"] = f"XML parse error: {e}"

        return result

    @staticmethod
    def _dataframes_to_result(dfs: dict[str, pd.DataFrame], source_type: str) -> dict:
        result = {"type": source_type, "sheets": [], "data": {}, "metadata": {}}
        for sheet_name, df in dfs.items():
            df = df.fillna("")
            columns = []
            for col in df.columns:
                numeric_count = pd.to_numeric(df[col], errors="coerce").notna().sum()
                col_type = "numeric" if numeric_count > len(df) * 0.6 else "string"
                columns.append({"name": str(col), "type": col_type})

            rows = df.to_dict(orient="records")
            result["sheets"].append(sheet_name)
            result["data"][sheet_name] = {
                "columns": columns,
                "rows": rows,
                "totalRows": len(rows),
                "totalCols": len(columns),
            }
        return result


async def parse_file(file_bytes: bytes, filename: str) -> dict:
    return await FileParser.parse(file_bytes, filename)

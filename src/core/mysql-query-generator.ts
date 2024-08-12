import {
  AndWhereExpression,
  ColumnData,
  InsertColumnSet,
  NestedQuery,
  OrWhereExpression,
  Query,
  SimpleWhereExpression,
  UpdateColumnSet,
  WhereExpression,
  WhereParamValue,
} from "./types";

const processSimpleExp = <T>(exp: SimpleWhereExpression<T>): Query => {
  const data: ColumnData[] = [];
  let sql = Object.entries(exp)
    .map(([key, opts]) => {
      const columnName = `\`${key}\``;
      const paramValue: WhereParamValue = opts as WhereParamValue;
      let value = paramValue.value;
      let operator = "";
      if (value === null) {
        operator = paramValue.op === "EQUALS" ? " IS " : " IS NOT ";
      } else if (Array.isArray(value)) {
        operator = paramValue.op === "IN" ? " IN " : " NOT IN ";
        value.forEach((v) => {
          if (typeof v === "object") {
            const nestedQuery = v as NestedQuery<T>;
            const selectQuery = generateSelectSql(
              nestedQuery.tableName,
              nestedQuery.where,
              [...nestedQuery.selectedField]
            );

            data.push(...selectQuery.data);
            return `${columnName}${operator}(${selectQuery.sql})`;
          } else {
            data.push(v);
            const placeholders = value.map(() => "?").join(", ");
            return `${columnName}${operator}(${placeholders})`;
          }
        });
      } else {
        switch (paramValue.op) {
          case "EQUALS":
            operator = " = ";
            data.push(value);
            value = "?";
            break;
          case "NOT_EQUALS":
            operator = " != ";
            data.push(value);
            value = "?";
            break;
          case "STARTS_WITH":
            operator = " LIKE ";
            data.push(`${value}%`);
            value = "?";
            break;
          case "NOT_STARTS_WITH":
            operator = " NOT LIKE ";
            data.push(`${value}%`);
            value = "?";
            break;
          case "ENDS_WITH":
            operator = " LIKE ";
            data.push(`%${value}`);
            value = "?";
            break;
          case "NOT_ENDS_WITH":
            operator = " NOT LIKE ";
            data.push(`%${value}`);
            value = "?";
            break;
          case "CONTAINS":
            operator = " LIKE ";
            data.push(`%${value}%`);
            value = "?";
            break;
          case "NOT_CONTAINS":
            operator = " NOT LIKE ";
            data.push(`%${value}%`);
            value = "?";
            break;
          case "GREATER_THAN":
            operator = " > ";
            data.push(value);
            value = "?";
            break;
          case "GREATER_THAN_EQUALS":
            operator = " >= ";
            data.push(value);
            value = "?";
            break;
          case "LESSER_THAN":
            operator = " < ";
            data.push(value);
            value = "?";
            break;
          case "LESSER_THAN_EQUALS":
            operator = " <= ";
            data.push(value);
            value = "?";
            break;
        }
      }
      return `${columnName}${operator}${value}`;
    })
    .join(" AND ");
  sql = `(${sql})`;
  return { sql, data };
};

export const generateWhereClauseSql = <T>(
  whereParams: WhereExpression<T>
): Query => {
  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    const andClause = (whereParams as AndWhereExpression<T>).AND.map((exp) =>
      generateWhereClauseSql(exp)
    )
      .filter((c) => c.sql)
      .map((c) => c.sql)
      .join(" AND ");

    const data = (whereParams as AndWhereExpression<T>).AND.flatMap(
      (exp) => generateWhereClauseSql(exp).data
    );

    return {
      sql: andClause ? `(${andClause})` : "",
      data,
    };
  } else if (whKeys.includes("OR")) {
    const orClause = (whereParams as OrWhereExpression<T>).OR.map((exp) =>
      generateWhereClauseSql(exp)
    )
      .filter((c) => c.sql)
      .map((c) => c.sql)
      .join(" OR ");

    const data = (whereParams as OrWhereExpression<T>).OR.flatMap(
      (exp) => generateWhereClauseSql(exp).data
    );

    return {
      sql: orClause ? `(${orClause})` : "",
      data,
    };
  } else {
    return processSimpleExp(whereParams as SimpleWhereExpression<T>);
  }
};

export const generateInsertSql = <T>(
  tableName: string,
  row: InsertColumnSet<T>
): Query => {
  const data: ColumnData[] = [];
  const placeHolder: string[] = [];
  let columns: string[] = [];
  Object.entries(row).forEach(([key, value]) => {
    let insertValue: ColumnData = value as ColumnData;
    columns.push(key);
    data.push(insertValue);
    placeHolder.push(`?`);
  });
  const sql = `INSERT INTO \`${tableName}\` (${columns.join(", ")}) VALUES (${placeHolder.join(", ")})`;
  return { sql, data };
};

export const generateSelectSql = <T>(
  tableName: string,
  where: WhereExpression<T>,
  fieldToSelect?: Partial<keyof T>[],
  offset?: number,
  limit?: number
): Query => {
  let sql = "SELECT";
  const columns: string[] = [];
  const data: ColumnData[] = [];
  if (fieldToSelect?.length) {
    fieldToSelect.forEach((field) => columns.push(`\`${field.toString()}\``));
    sql += ` ${columns.join(", ")} `;
  } else {
    sql += ` * `;
  }

  sql += `FROM \`${tableName}\``;
  if (Object.keys(where).length) {
    const whereClause = generateWhereClauseSql<T>(where);
    data.push(...whereClause.data);
    sql += ` WHERE ${whereClause.sql} `;
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset) {
    sql += ` OFFSET ${offset}`;
  }
  return { sql, data };
};

export const generateUpdateSql = <T>(
  row: UpdateColumnSet<T>,
  tableName: string,
  where: WhereExpression<T>
): Query => {
  const data: ColumnData[] = [];
  const placeHolder: string[] = [];
  Object.entries(row).forEach(([key, value]) => {
    let updateValue: ColumnData = value as ColumnData;
    data.push(updateValue);
    placeHolder.push(` ${key} = ?`);
  });
  placeHolder.join(", ");
  let sql = `UPDATE \`${tableName}\` SET ${placeHolder} `;
  if (Object.keys(where).length) {
    const whereClause = generateWhereClauseSql<T>(where);
    data.push(...whereClause.data);
    sql += " WHERE " + whereClause.sql;
  }

  return { sql, data };
};

export const generateDeleteSql = <T>(
  tableName: string,
  where: WhereExpression<T>
): Query => {
  const data: ColumnData[] = [];
  let sql = `DELETE FROM \`${tableName}\``;
  if (Object.keys(where).length) {
    const whereClause = generateWhereClauseSql<T>(where);
    data.push(...whereClause.data);
    sql += " WHERE " + whereClause.sql;
  }
  return { sql, data };
};

export const generateCountSql = <T>(
  tableName: string,
  where: WhereExpression<T>,
  columnName?: keyof T,
  columnNameAlias?: string
): Query => {
  const data: ColumnData[] = [];
  let sql = "SELECT COUNT";

  if (columnName) {
    sql += `(\`${String(columnName)}\`) `;
  } else {
    sql += "(*)";
  }

  if (columnNameAlias) {
    sql += `AS \`${columnNameAlias}\` `;
  }

  sql += `FROM  \`${tableName}\``;

  if (Object.keys(where).length) {
    const whereClause = generateWhereClauseSql<T>(where);
    data.push(...whereClause.data);
    sql += " WHERE " + whereClause.sql;
  }
  return { sql, data };
};

import execute from "./actions";
import { cloneDeep } from "lodash";
const { utils } = require("@rjsf/core");
const { deepEquals } = utils;

function doRunRules(engine, formData, schema, uiSchema, extraActions = {}) {
  let schemaCopy = cloneDeep(schema);
  let uiSchemaCopy = cloneDeep(uiSchema);
  let formDataCopy = cloneDeep(formData);

  // Exclude undefined values as they are note valid facts
  const formDataSanitized = cloneDeep(formData);
  Object.keys(formDataSanitized).forEach(
    (key) =>
      formDataSanitized[key] === undefined && delete formDataSanitized[key]
  );

  let res = engine.run(formDataSanitized).then((result) => {
    let events;
    if (Array.isArray(result)) {
      events = result;
    } else if (
      typeof result === "object" &&
      result.events &&
      Array.isArray(result.events)
    ) {
      events = result.events;
    } else {
      throw new Error("Unrecognized result from rules engine");
    }
    events.forEach((event) =>
      execute(event, schemaCopy, uiSchemaCopy, formDataCopy, extraActions)
    );
  });

  return res.then(() => {
    return {
      schema: schemaCopy,
      uiSchema: uiSchemaCopy,
      formData: formDataCopy,
    };
  });
}

export function normRules(rules) {
  return rules.sort(function (a, b) {
    if (a.order === undefined) {
      return b.order === undefined ? 0 : 1;
    }
    return b.order === undefined ? -1 : a.order - b.order;
  });
}

export default function rulesRunner(
  schema,
  uiSchema,
  rules,
  engine,
  extraActions
) {
  engine = typeof engine === "function" ? new engine([], schema) : engine;
  normRules(rules).forEach((rule) => engine.addRule(rule));

  return (formData) => {
    if (formData === undefined || formData === null) {
      return Promise.resolve({ schema, uiSchema, formData });
    }
    return doRunRules(engine, formData, schema, uiSchema, extraActions).then(
      (conf) => {
        if (deepEquals(conf.formData, formData)) {
          return conf;
        } else {
          return doRunRules(
            engine,
            conf.formData,
            schema,
            uiSchema,
            extraActions
          );
        }
      }
    );
  };
}

import remove from "./remove";
import require from "./require";
import uiAppend from "./uiAppend";
import uiReplace from "./uiReplace";
import uiOverride from "./uiOverride";
import dataTransform from "./dataTransform";

export const DEFAULT_ACTIONS = {
  remove,
  require,
  uiAppend,
  uiReplace,
  uiOverride,
  dataTransform,
};

export default function execute(
  { type, params },
  schema,
  uiSchema,
  formData,
  extraActions = {}
) {
  try {
    const action = extraActions[type]
      ? extraActions[type]
      : DEFAULT_ACTIONS[type];

    const { entity, ...extraData } = formData;

    action(params, schema, uiSchema, entity, extraData);
  } catch (error) {
    console.warn(`error when executing action ${type}`);
  }
}

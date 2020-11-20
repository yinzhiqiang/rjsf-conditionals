import { get, set } from "lodash";
import PropTypes from "prop-types";
import { validateFields } from "./validateAction";
import { toArray } from "../utils";



/**
 * pick data by filed names
 * 
 * params:
 * [
 * {"path": name, "defaultValue": default value}
 * ]
 * 
 * @param data
 * @param params
 * @returns picked data
 */
function doPick(data, params) {
  if (!params) { throw new Error(`cannot get params to pick data`); }
  let fields = toArray(params);
  let pickedData = {}; 

  fields.forEach(field => { 
    let { path, defaultValue = null } = field;
    let value = get(data, path, defaultValue);
    set(pickedData,path,value);
  });

  return pickedData;
}


/**
 * Remove specified field both from uiSchema and schema
 *
 * @param field
 * @param schema
 * @param uiSchema
 * @returns {{schema: *, uiSchema: *}}
 */
export default function dataTransform(params, schema, uiSchema, formData) {
  const { type, ...options } = params;
  switch (type) {
    case "pick":
      formData = doPick(formData, options);
      break;
  
    default:
      break;
  }
    let fieldArr = toArray(field);
    fieldArr.forEach((field) =>
      doRemove(
        findRelSchemaAndField(field, schema),
        findRelUiSchema(field, uiSchema),
        formData
      )
    );
  }

  dataTransform.propTypes = {
    type: PropTypes.string.isRequired,
  };
  
  dataTransform.validate = validateFields("dataTransform", function ({ type, ...otherOptions }) {
    return field;
  });  
import { set, keys, unset,has } from "lodash";
import PropTypes from "prop-types";

/**
 * pick data by filed names
 * 
 * params:
 * [
 * {"path": name, "defaultValue": default value}
 * ]
 * 
 * @param formData
 * @param params
 * @returns picked data
 */
function doPick(formData, params) {
  if (!params) { throw new Error(`cannot get params to pick data`); }
 
  let { fields = [] } = params;
  let names = keys(formData);
  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    if (fields.findIndex(field=>{
      let { path } = field;
      return name  === path;
    })<0) {
      unset(formData,name);
    }   
  }

  fields.forEach((field) => {
    let { path, defaultValue = null } = field;
    if (defaultValue&&!has(formData,path)){
      set(formData, path, defaultValue);
    }    
  });
}


/**
 * Remove specified field both from uiSchema and schema
 *
 * @param field
 * @param schema
 * @param uiSchema
 * @returns {{schema: *, uiSchema: *}}
 */
export default function dataTransform(params, schema, uiSchema, formData, extraData) {
  const { type, ...options } = params;
  switch (type) {
    case "pick":
      doPick(formData, options);
      break;
  
    default:
      break;
  }
  }

  dataTransform.propTypes = {
    type: PropTypes.string.isRequired,
  };
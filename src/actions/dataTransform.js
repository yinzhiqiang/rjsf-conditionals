import { validateFields } from "./validateAction";
import PropTypes from "prop-types";

/**
 * Remove specified field both from uiSchema and schema
 *
 * @param field
 * @param schema
 * @param uiSchema
 * @returns {{schema: *, uiSchema: *}}
 */
export default function dataTransform(params, schema, uiSchema, formData) {
    const { type, ...otherOptions } = params;
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
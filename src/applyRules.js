import React, { Component } from "react";
import PropTypes from "prop-types";
const { utils } = require("@rjsf/core");
const { deepEquals } = utils;
import { toError } from "./utils";
import rulesRunner from "./rulesRunner";

import { DEFAULT_ACTIONS } from "./actions";
import validateAction from "./actions/validateAction";
import env from "./env";

export default function applyRules(
  schema,
  uiSchema,
  rules,
  Engine,
  extraActions = {}
) {
  if (env.isDevelopment()) {
    const propTypes = {
      Engine: PropTypes.func.isRequired,
      rules: PropTypes.arrayOf(
        PropTypes.shape({
          conditions: PropTypes.object.isRequired,
          order: PropTypes.number,
          event: PropTypes.oneOfType([
            PropTypes.shape({
              type: PropTypes.string.isRequired,
            }),
            PropTypes.arrayOf(
              PropTypes.shape({
                type: PropTypes.string.isRequired,
              })
            ),
          ]),
        })
      ).isRequired,
      extraActions: PropTypes.object,
    };

    PropTypes.checkPropTypes(
      propTypes,
      { rules, Engine, extraActions },
      "props",
      "rjsf-conditionals"
    );

    rules
      .reduce((agg, { event }) => agg.concat(event), [])
      .forEach(({ type, params }) => {
        // Find associated action
        let action = extraActions[type]
          ? extraActions[type]
          : DEFAULT_ACTIONS[type];
        if (action === undefined) {
          toError(`Rule contains invalid action "${type}"`);
          return;
        }

        validateAction(action, params, schema, uiSchema);
      });
  }

  const runRules = rulesRunner(schema, uiSchema, rules, Engine, extraActions);

  return (FormComponent) => {
    class FormWithConditionals extends Component {
      constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.updateConf = this.updateConf.bind(this);
        let { formData = {} } = this.props;

        this.shouldUpdate = false;
        this.state = { schema, uiSchema };
        this.updateConf(formData);
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        let formDataChanged =
          nextProps.formData && !deepEquals(nextProps.formData, this.formData);
        if (formDataChanged) {
          this.updateConf(nextProps.formData);
          this.shouldUpdate = true;
        } else {
          this.shouldUpdate =
            this.shouldUpdate ||
            !deepEquals(
              nextProps,
              Object.assign({}, this.props, { formData: nextProps.formData })
            );
        }
      }

      updateConf(formData) {
        this.formData = formData;
        return runRules(formData).then((conf) => {
          this.formData = conf.formData;
          let newState = { schema: conf.schema, uiSchema: conf.uiSchema };
          if (
            !deepEquals(this.formData, conf.formData) ||
            !deepEquals(newState, this.state)
          ) {
            this.shouldUpdate = true;
            this.setState(newState);
          }
          return conf;
        });
      }

      handleChange(change) {
        let { formData } = change;
        let updTask = this.updateConf(formData);

        let { onChange } = this.props;
        if (onChange) {
          updTask.then((conf) => {
            let updChange = Object.assign({}, change, conf);
            onChange(updChange);
          });
        }
      }

      shouldComponentUpdate() {
        if (this.shouldUpdate) {
          this.shouldUpdate = false;
          return true;
        }
        return false;
      }

      render() {
        // Assignment order is important
        let formConf = Object.assign({}, this.props, this.state, {
          onChange: this.handleChange,
          formData: this.formData,
        });
        return <FormComponent {...formConf} />;
      }
    }

    return FormWithConditionals;
  };
}

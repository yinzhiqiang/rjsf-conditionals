import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

import { toError } from "./utils";
import rulesRunner from "./rulesRunner";

import { DEFAULT_ACTIONS } from "./actions";
import validateAction from "./actions/validateAction";
import env from "./env";

const { utils } = require("@rjsf/core");
const { deepEquals } = utils;

/**
 * Usage:
 * const ConditionalForm = applyRules(...)(RjsfFormComponent);
 * return <ConditionalForm formData={formData} onSubmit={handleSubmit} />
 * @param schema
 * @param uiSchema
 * @param rules
 * @param Engine
 * @param [extraActions]
 * @return {function(*): React.ForwardRefExoticComponent<React.PropsWithoutRef<{}> & React.RefAttributes<unknown>>}
 */
export default function applyRules(
  schema,
  uiSchema,
  rules,
  Engine,
  extraActions = {},
  formRef,
  ...props
) {
  if (env.isDevelopment()) {
    const propTypes = {
      Engine: PropTypes.oneOfType([PropTypes.object, PropTypes.func])
        .isRequired,
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

        // this.handleChange = this.handleChange.bind(this);
        this.updateConf = this.updateConf.bind(this);
        let { formData = {} } = this.props;

        this.shouldUpdate = false;
        this.state = { schema: {}, uiSchema: {} };
        this.updateConf({ entity: formData });
      }

      UNSAFE_componentWillReceiveProps(nextProps) {
        let formDataChanged =
          nextProps.formData &&
          !deepEquals({ entity: nextProps.formData }, this.formData);
        if (formDataChanged) {
          this.updateConf({ entity: nextProps.formData });
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
          let dataChanged = !deepEquals(this.formData, conf.formData);
          this.formData = conf.formData;

          let newState = { schema: conf.schema, uiSchema: conf.uiSchema };
          let confChanged = !deepEquals(newState, this.state);
          if (dataChanged || confChanged) {
            this.shouldUpdate = true;
            this.setState(newState);

            if (dataChanged) {
              const { onChange } = this.props;
              onChange({
                ...conf,
                formData: conf.formData.entity,
              });
            }
          }

          return conf;
        });
      }

      /** handleChange(change) {
   let { formData } = change;
    let updTask = this.updateConf(formData);
    let { onChange } = this.props;
    if (onChange) {
      updTask.then((conf) => {
        let updChange = Object.assign({}, change, conf);
        onChange(updChange);
      });
    }
  }*/

      shouldComponentUpdate() {
        if (this.shouldUpdate) {
          this.shouldUpdate = false;
          return true;
        }
        return false;
      }

      render() {
        const { schema, uiSchema, ...props } = this.props;
        // Assignment order is important
        let formConf = Object.assign({}, props, this.state, {
          //  onChange: this.handleChange,
          //   formData: this.formData,
          ref: formRef,
        });
        return <FormComponent {...formConf} />;
      }
    }
    return FormWithConditionals;
  };
}

import React from "react";
import Form from "@rjsf/core";
import Engine from "json-rules-engine-simplified";
import applyRules from "../src";
import sinon from "sinon";
import Adapter from "enzyme-adapter-react-16";
import { configure, mount } from "enzyme";
import { fireEvent, render } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import rulesRunner from '../src/rulesRunner';
import { FormWithConditionals } from '../src/applyRules';

configure({ adapter: new Adapter() });

const schema = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    name: { type: "string" },
  },
};

const RULES = [
  {
    conditions: {
      firstName: "empty",
    },
    event: {
      type: "remove",
      params: {
        field: ["lastName", "name"],
      },
    },
  },
];

test("Re render on rule change", async () => {

  const runRules = rulesRunner(schema, {}, RULES, Engine);

  const handleChangeSpy = sinon.spy(FormWithConditionals.prototype, "handleChange");
  const updateConfSpy = sinon.spy(FormWithConditionals.prototype, "updateConf");
  const setStateSpy = sinon.spy(FormWithConditionals.prototype, "setState");

  const { container } = render(<FormWithConditionals formComponent={Form} initialSchema={schema} rulesRunner={runRules} formData={{ firstName: "A" }} />);

  expect(updateConfSpy.calledOnce).toEqual(true);
  await waitFor(() => {
    // componentDidMount called updateConfSpy which will update state
    expect(setStateSpy.callCount).toEqual(1);
  });
  expect(handleChangeSpy.notCalled).toEqual(true);

  const firstNameInput = container.querySelector("[id='root_firstName']");
  expect(firstNameInput).not.toBeNull();
  expect(firstNameInput.value).toEqual("A");

  fireEvent.change(firstNameInput, { target: { value: "" } });

  await waitFor(() => {
    expect(handleChangeSpy.callCount).toEqual(1);
  });
  expect(updateConfSpy.callCount).toEqual(2);
  await waitFor(() => {
    expect(setStateSpy.callCount).toEqual(2);
  });

  FormWithConditionals.prototype.handleChange.restore();
  FormWithConditionals.prototype.updateConf.restore();
  FormWithConditionals.prototype.setState.restore();
});

test("onChange called with corrected schema", () => {
  let ResForm = applyRules(schema, {}, RULES, Engine)(Form);
  const onChangeSpy = sinon.spy(() => {});
  const wrapper = mount(
    <ResForm formData={{ firstName: "A" }} onChange={onChangeSpy} />
  );

  wrapper
    .find("#root_firstName")
    .find("input")
    .simulate("change", { target: { value: "" } });

  return new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
    const expSchema = {
      type: "object",
      properties: {
        firstName: { type: "string" },
      },
    };

    expect(onChangeSpy.calledOnce).toEqual(true);
    expect(onChangeSpy.getCall(0).args[0].schema).toEqual(expSchema);
  });
});

test("chain of changes processed", async () => {
  let ResForm = applyRules(schema, {}, RULES, Engine)(Form);
  const onChangeSpy = sinon.spy(() => {});
  const { container } = render(
    <ResForm formData={{ firstName: "first" }} onChange={onChangeSpy} />
  );
  await waitFor(() => expect(onChangeSpy.calledOnce));

  const firstNameInput = container.querySelector("[id='root_firstName']");
  expect(firstNameInput).not.toBeNull();
  expect(firstNameInput.value).toEqual("first");
  const chainOfChanges = ["fir", "fi", "f", ""];
  chainOfChanges.forEach((inputValue) => {
    fireEvent.change(firstNameInput, {
      target: { value: inputValue },
    });
    fireEvent.blur(firstNameInput);
  });
  await waitFor(() => {
    const lastCall = onChangeSpy.getCall(-1);
    const formData = lastCall.args[0].formData || {};
    expect(formData.firstName).toBeUndefined();
  });

  expect(onChangeSpy.getCall(-1).args[0].schema).toStrictEqual({
    properties: { firstName: { type: "string" } },
    type: "object",
  });

  expect(firstNameInput.value).toEqual("");
});

test("can submit with forwarded ref", async () => {
  let ResForm = applyRules(schema, {}, RULES, Engine)(Form);
  const onSubmitSpy = sinon.spy(() => {});
  let formRef;
  const { container } = render(
    <ResForm formData={{ firstName: "first" }} onSubmit={onSubmitSpy} ref={form => {formRef = form;}} />
  );
  const firstNameInput = container.querySelector("[id='root_firstName']");
  await waitFor(() => {
    expect(firstNameInput.value).toEqual("first");
  });

  formRef.submit();

  expect(onSubmitSpy.calledOnce).toEqual(true);
});

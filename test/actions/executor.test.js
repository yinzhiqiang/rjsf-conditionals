import Executor from "../../src/actions/executor";

let schema = {
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    name: { type: "string" },
  },
};

let executor = new Executor([], schema);

test("executes single action", () => {
  let singleAction = [
    {
      type: "remove",
      params: { fields: ["firstName"] },
    },
    {
      type: "require",
      params: { fields: ["name"] },
    },
  ];

  return executor.run(singleAction).then(({ schema }) => {
    let expectedSchema = {
      required: ["name"],
      properties: {
        lastName: schema.properties.lastName,
        name: schema.properties.name,
      },
    };
    expect(schema).toEqual(expectedSchema);
  });
});

test("executes multiple actions", () => {
  let multiAction = [
    {
      type: "remove",
      params: { fields: ["firstName"] },
    },
    {
      type: "require",
      params: { fields: ["name"] },
    },
    {
      type: "replaceUi",
      params: { fields: ["name"], conf: { classNames: "col-md-5" } },
    },
  ];

  return executor.run(multiAction).then(({ schema, uiSchema }) => {
    let expectedSchema = {
      required: ["name"],
      properties: {
        lastName: schema.properties.lastName,
        name: schema.properties.name,
      },
    };
    expect(schema).toEqual(expectedSchema);
    expect(uiSchema).toEqual({ name: { classNames: "col-md-5" } });
  });
});
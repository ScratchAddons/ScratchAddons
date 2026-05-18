/**
 * @typedef {Object} BlockDefinition - Describes a new block definition
 *
 * @property {Object} initData - the information to pass to Blockly.Block#init (excluding `msg`)
 * @property {string} flyout.after - which block in the flyout to insert this after
 * @property {boolean} flyout.separator - whether to add a gap in the flyout after the previous block
 * @property {Object<string, string[]>} flyout.defaultInputs - the default inputs for the flyout, in the form INPUT_NAME: [valueType, FIELD_NAME, value]
 * @property {MapInfo[]} map - describes the possible mappings between this block and vanilla scratch
 */

/**
 * @typedef {Object} MapInfo - describes one possible mapping between this block and vanilla scratch
 *
 * @property {string} opcode
 * @property {Object<string, MapInfo|string>} inputs - if an input is a string, then it is an input name of the original block
 */

/**
 * Describes the new block definitions
 * @type {Object<string, BlockDefinition>}
 */
export const blockDefinitions = {
  operator_gte: {
    initData: {
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
        },
        {
          type: "input_value",
          name: "OPERAND2",
        },
      ],
      category: "operators",
      extensions: ["colours_operators", "output_boolean"],
    },
    flyout: {
      defaultInputs: {
        OPERAND1: ["text", "TEXT", ""],
        OPERAND2: ["text", "TEXT", "50"],
      },
      after: "operator_equals",
      separator: false,
    },
    map: [
      {
        opcode: "operator_not",
        inputs: {
          OPERAND: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND2",
              OPERAND2: "OPERAND1",
            },
          },
          OPERAND2: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND2",
              OPERAND2: "OPERAND1",
            },
          },
        },
      },
    ],
  },
  operator_lte: {
    initData: {
      args0: [
        {
          type: "input_value",
          name: "OPERAND1",
        },
        {
          type: "input_value",
          name: "OPERAND2",
        },
      ],
      category: "operators",
      extensions: ["colours_operators", "output_boolean"],
    },
    flyout: {
      defaultInputs: {
        OPERAND1: ["text", "TEXT", ""],
        OPERAND2: ["text", "TEXT", "50"],
      },
      after: "operator_equals",
      separator: false,
    },
    map: [
      {
        opcode: "operator_not",
        inputs: {
          OPERAND: {
            opcode: "operator_gt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_lt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_lt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND2",
              OPERAND2: "OPERAND1",
            },
          },
          OPERAND2: {
            opcode: "operator_lt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
        },
      },
      {
        opcode: "operator_or",
        inputs: {
          OPERAND1: {
            opcode: "operator_lt",
            inputs: {
              OPERAND1: "OPERAND1",
              OPERAND2: "OPERAND2",
            },
          },
          OPERAND2: {
            opcode: "operator_equals",
            inputs: {
              OPERAND1: "OPERAND2",
              OPERAND2: "OPERAND1",
            },
          },
        },
      },
    ],
  },
  looks_previouscostume: {
    initData: {
      category: "looks",
      extensions: ["colours_looks", "shape_statement"],
    },
    flyout: {
      after: "looks_nextcostume",
      separator: false,
    },
    map: [
      {
        opcode: "looks_switchcostumeto",
        inputs: {
          COSTUME: {
            opcode: "operator_join",
            inputs: {
              STRING1: {
                opcode: "text",
                fields: {
                  TEXT: {
                    value: "previous costume",
                  },
                },
              },
              STRING2: {
                opcode: "text",
                fields: {
                  TEXT: {
                    value: "",
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

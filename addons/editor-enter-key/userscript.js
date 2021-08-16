export default async function ({ addon, global, cons, msg }) {
    const Blockly = await addon.tab.traps.getBlockly();

    Blockly.Blocks['sensing_keyoptions'] = {
        init: function () {
            this.jsonInit({
                "message0": "%1",
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "KEY_OPTION",
                        "options": [
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_SPACE, 'space'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_UP, 'up arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_DOWN, 'down arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_RIGHT, 'right arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_LEFT, 'left arrow'],
                            [msg("enter-key"), 'enter'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_ANY, 'any'],
                            ['a', 'a'],
                            ['b', 'b'],
                            ['c', 'c'],
                            ['d', 'd'],
                            ['e', 'e'],
                            ['f', 'f'],
                            ['g', 'g'],
                            ['h', 'h'],
                            ['i', 'i'],
                            ['j', 'j'],
                            ['k', 'k'],
                            ['l', 'l'],
                            ['m', 'm'],
                            ['n', 'n'],
                            ['o', 'o'],
                            ['p', 'p'],
                            ['q', 'q'],
                            ['r', 'r'],
                            ['s', 's'],
                            ['t', 't'],
                            ['u', 'u'],
                            ['v', 'v'],
                            ['w', 'w'],
                            ['x', 'x'],
                            ['y', 'y'],
                            ['z', 'z'],
                            ['0', '0'],
                            ['1', '1'],
                            ['2', '2'],
                            ['3', '3'],
                            ['4', '4'],
                            ['5', '5'],
                            ['6', '6'],
                            ['7', '7'],
                            ['8', '8'],
                            ['9', '9']
                        ]
                    }
                ],
                "extensions": ["colours_sensing", "output_string"]
            });
        }
    }


    Blockly.Blocks['event_whenkeypressed'] = {
        init: function () {
            this.jsonInit({
                "id": "event_whenkeypressed",
                "message0": Blockly.Msg.EVENT_WHENKEYPRESSED,
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "KEY_OPTION",
                        "options": [
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_SPACE, 'space'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_UP, 'up arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_DOWN, 'down arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_RIGHT, 'right arrow'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_LEFT, 'left arrow'],
                            [msg("enter-key"), 'enter'],
                            [Blockly.Msg.EVENT_WHENKEYPRESSED_ANY, 'any'],
                            ['a', 'a'],
                            ['b', 'b'],
                            ['c', 'c'],
                            ['d', 'd'],
                            ['e', 'e'],
                            ['f', 'f'],
                            ['g', 'g'],
                            ['h', 'h'],
                            ['i', 'i'],
                            ['j', 'j'],
                            ['k', 'k'],
                            ['l', 'l'],
                            ['m', 'm'],
                            ['n', 'n'],
                            ['o', 'o'],
                            ['p', 'p'],
                            ['q', 'q'],
                            ['r', 'r'],
                            ['s', 's'],
                            ['t', 't'],
                            ['u', 'u'],
                            ['v', 'v'],
                            ['w', 'w'],
                            ['x', 'x'],
                            ['y', 'y'],
                            ['z', 'z'],
                            ['0', '0'],
                            ['1', '1'],
                            ['2', '2'],
                            ['3', '3'],
                            ['4', '4'],
                            ['5', '5'],
                            ['6', '6'],
                            ['7', '7'],
                            ['8', '8'],
                            ['9', '9']
                        ]
                    }
                ],
                "category": Blockly.Categories.event,
                "extensions": ["colours_event", "shape_hat"]
            });
        }
    }
}
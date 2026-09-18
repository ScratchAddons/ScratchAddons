export default async function ({ addon, console }) {
    const vm = await addon.tab.traps.vm();

    if (!vm) {
        console.warn("custom-fps: Scratch VM not found");
        return;
    }

    class CustomFPS {
        constructor(runtime) {
            this.runtime = runtime;
            this.fps = 30;

            this.applyFPS();
        }

        getInfo() {
            return {
                id: "customfps",
                name: "Custom FPS",
                color1: "#5C4B8A",
                color2: "#493B70",
                blocks: [
                    {
                        opcode: "setFPS",
                        blockType: "command",
                        text: "set FPS to [FPS]",
                        arguments: {
                            FPS: {
                                type: "number",
                                defaultValue: 60
                            }
                        }
                    },
                    {
                        opcode: "changeFPS",
                        blockType: "command",
                        text: "change FPS by [AMOUNT]",
                        arguments: {
                            AMOUNT: {
                                type: "number",
                                defaultValue: 10
                            }
                        }
                    },
                    {
                        opcode: "getFPS",
                        blockType: "reporter",
                        text: "FPS"
                    }
                ]
            };
        }

        setFPS(args) {
            const fps = Number(args.FPS);

            if (!Number.isFinite(fps)) return;

            this.fps = Math.max(0, Math.min(250, fps));
            this.applyFPS();
        }

        changeFPS(args) {
            const amount = Number(args.AMOUNT);

            if (!Number.isFinite(amount)) return;

            this.fps = Math.max(0, Math.min(250, this.fps + amount));
            this.applyFPS();
        }

        getFPS() {
            return this.fps;
        }

        applyFPS() {
            const runtime = this.runtime;

            /*
             * Scratch's runtime uses a sequencer timer to control
             * how frequently scripts execute.
             *
             * Different Scratch/TurboWarp versions expose this
             * slightly differently, so keep the compatibility
             * handling here.
             */

            if (typeof runtime.setFramerate === "function") {
                runtime.setFramerate(this.fps);
                return;
            }

            if (runtime.setFramerate) {
                runtime.setFramerate(this.fps);
                return;
            }

            if (runtime.sequencer &&
                typeof runtime.sequencer.setFramerate === "function") {
                runtime.sequencer.setFramerate(this.fps);
                return;
            }

            console.warn(
                "custom-fps: Could not find a supported framerate API."
            );
        }
    }

    /*
     * Register the extension with the VM.
     *
     * This part depends on the exact Scratch Addons / Scratch VM
     * version being targeted.
     */
    const extension = new CustomFPS(vm.runtime);

    if (vm.runtime.extensionManager) {
        vm.runtime.extensionManager._registerInternalExtension(
            extension
        );
    }
}

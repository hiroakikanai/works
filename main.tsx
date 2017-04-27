/// <reference path="../../node_modules/@types/react/index.d.ts"/>
/// <reference path="../../node_modules/@types/react-dom/index.d.ts"/>
/// <reference path="../../node_modules/@types/three/index.d.ts"/>

/// <reference path="api/api.ts"/>

/// <reference path="component/avatar.tsx"/>
/// <reference path="component/header.tsx"/>
/// <reference path="component/input_show_button.tsx"/>
/// <reference path="component/main.tsx"/>
/// <reference path="component/question_input.tsx"/>
/// <reference path="component/talks.tsx"/>

/// <reference path="avatar/character.ts"/>
/// <reference path="avatar/character.d.ts"/>
/// <reference path="avatar/effect/sparkle.ts"/>

/// <reference path="data_structure/answer.ts"/>
/// <reference path="data_structure/data_count.ts"/>
/// <reference path="data_structure/level.ts"/>
/// <reference path="data_structure/question.ts"/>

/// <reference path="event/event_bus.ts"/>
/// <reference path="event/answer_event.ts"/>
/// <reference path="event/question_event.ts"/>

declare function fetch(url: String): any;
declare function fetch(url: String, option: any): any;
declare namespace JSX {
  interface IntrinsicElements {
    "animate": any;
  }
}

class Main {
    constructor() {
        ReactDOM.render(
            (
                <div id="react-root">
                    <Dialogue.Component.Header />
                    <Dialogue.Component.Main />
                </div>
            ),
            document.querySelector("#contents")
        );
    }
}

new Main();

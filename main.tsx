/// <reference path="../../node_modules/@types/react/index.d.ts"/>
/// <reference path="../../node_modules/@types/react-dom/index.d.ts"/>

declare function fetch(url : String) : any;
declare function fetch(url : String, option : any) : any;

class InputText {
  id : number = Date.now();
  constructor(public text : string) {};
}

class InputTextList {
  list : InputText[] = [];
  add(text : string) {
    this.list.push(new InputText(text));
  }
}

interface ForInputActionProps extends React.Props < {} > {
  onSubmit: (inputChara : string) => void;
}
interface ForInputActionState {
  inputChara : string;
  muraiClassName : string;
  muraiSrc : string;
}
class ForInputAction extends React.Component < ForInputActionProps, ForInputActionState > {
constructor(props : ForInputActionProps) {
  super(props);
  this.state = {
    inputChara: "",
    muraiClassName: "murai_animation_1",
    muraiSrc: "images/murai/1.png"
  } as ForInputActionState;
}
  private handleInputTextChange(e : React.FormEvent < {} >) {
    let inputValue = (e.target as HTMLInputElement).value;
    this.setState({inputChara: inputValue} as ForInputActionState);
  }
  private handleSubmit(e : React.SyntheticEvent < {} >) {
    if (this.state.inputChara == "") {
      e.preventDefault();
    } else {

      e.preventDefault();
      this.props.onSubmit(this.state.inputChara);
      this.setState({inputChara: "", muraiClassName: "bounceOut"} as ForInputActionState);

      setTimeout(function () {
        let muraicnt1 = Math.floor(Math.random() * 2);
        let murai_classname = "murai_animation_" + muraicnt1;
        let muraicnt2 = Math.floor(Math.random() * 9);
        let murai_src = "images/murai/" + muraicnt2 + ".png";
        this.setState({muraiClassName: murai_classname, muraiSrc: murai_src} as ForInputActionState);
      }.bind(this), 1000);

    }
  }
  private handleMouseDown(e : React.SyntheticEvent < {} >) {};
  private handleMouseUp(e : React.SyntheticEvent < {} >) {};
  render() {
    return (
      <div>
        <img id="murai" className={this.state.muraiClassName} src={this.state.muraiSrc}/>
        <form id="formBox" onSubmit={this.handleSubmit.bind(this)}>
          <div>
            <input id="inputBox" type="text" value={this.state.inputChara} onChange={this.handleInputTextChange.bind(this)}/>
            <input id="textSubmit" type="submit" value="送信" onMouseDown={this.handleMouseDown.bind(this)} onMouseUp={this.handleMouseUp.bind(this)}/>
          </div>
        </form>
      </div>
    );
  }
}

interface InputTextDispProps extends React.Props < {} > {
  displist: InputText[];
}
class InputTextDisp extends React.Component < InputTextDispProps, {} > {
  constructor() {
    super();
  }
  render() {
    let listItems = this.props.displist.map(x =>
      <li key={x.id} className="input_disp">
        <span>Q.{x.text}</span>
      </li>);
    return (
      <div>
        <ul>
          {listItems}
        </ul>
      </div>
    );
  }
}

interface AnswerTextDispProps extends React.Props < {} > {
  answerlist: InputText[];
};
class AnswerTextDisp extends React.Component < AnswerTextDispProps, {} > {
  constructor() {
    super();
  }
  render() {
    let listItems = this.props.answerlist.map(x =>
      <li key={x.id} className="answer_disp">
        <span>A.{x.text}</span>
      </li>)
    return (
      <div>
        <ul>
          {listItems}
        </ul>
      </div>
    )
  }
}

interface MainState {
  displistpost : InputTextList;
  answerlistpost : InputTextList;
}
class Main extends React.Component < {}, MainState > {
  constructor(props : {}) {
    super(props);
    this.state = {
      displistpost: new InputTextList(),
      answerlistpost: new InputTextList()
    } as MainState;
  }
  private handleInputTextSubmit(texts : string) {
    this.state.displistpost.add(texts);
    this.state.answerlistpost.add(texts);
    this.setState({displistpost: this.state.displistpost, answerlistpost: this.state.answerlistpost} as MainState);
  }
  render() {
    return (
      <div>
        <InputTextDisp displist={this.state.displistpost.list}/>
        <ForInputAction onSubmit={this.handleInputTextSubmit.bind(this)}/>
        <AnswerTextDisp answerlist={this.state.answerlistpost.list}/>
      </div>
    );
  }
}

ReactDOM.render(
  <Main/>, document.getElementById('root'));
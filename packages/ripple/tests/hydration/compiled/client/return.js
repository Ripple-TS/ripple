import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div class="after">after</div>`, 0);
var root = _$_.template(`<div class="before">before</div><!>`, 1);
var root_3 = _$_.template(`<div class="guard">guard hit</div>`, 1);
var root_4 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_2 = _$_.template(`<!><!>`, 1);
var root_6 = _$_.template(`<div class="guard">guard hit</div>`, 1);
var root_7 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_5 = _$_.template(`<!><!>`, 1);
var root_9 = _$_.template(`<div class="guard">guard</div>`, 1);
var root_10 = _$_.template(`<div class="after">after</div>`, 0);
var root_8 = _$_.template(`<div class="before">before</div><!><!>`, 1);
var root_12 = _$_.template(`<div class="guard">guard</div>`, 1);
var root_13 = _$_.template(`<div class="first">first</div><div class="second">second</div>`, 1);
var root_11 = _$_.template(`<!><!>`, 1);
var root_15 = _$_.template(`<div class="first">first guard</div>`, 1);
var root_17 = _$_.template(`<div class="second">second guard</div>`, 1);
var root_16 = _$_.template(`<!>`, 1);
var root_18 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_14 = _$_.template(`<!><!><!>`, 1);
var root_20 = _$_.template(`<div class="first">first guard</div>`, 1);
var root_22 = _$_.template(`<div class="second">second guard</div>`, 1);
var root_21 = _$_.template(`<!>`, 1);
var root_23 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_19 = _$_.template(`<!><!><!>`, 1);
var root_25 = _$_.template(`<div class="first">first guard</div>`, 1);
var root_27 = _$_.template(`<div class="second">second guard</div>`, 1);
var root_26 = _$_.template(`<!>`, 1);
var root_28 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_24 = _$_.template(`<!><!><!>`, 1);
var root_31 = _$_.template(`<div class="b">b is true</div>`, 1);
var root_30 = _$_.template(`<div class="a">a is true</div><!>`, 1);
var root_32 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_29 = _$_.template(`<!><!>`, 1);
var root_35 = _$_.template(`<div class="b">b is true</div>`, 1);
var root_34 = _$_.template(`<div class="a">a is true</div><!>`, 1);
var root_36 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_33 = _$_.template(`<!><!>`, 1);
var root_39 = _$_.template(`<div class="b">b is true</div>`, 1);
var root_38 = _$_.template(`<div class="a">a is true</div><!>`, 1);
var root_40 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_37 = _$_.template(`<!><!>`, 1);
var root_44 = _$_.template(`<div class="c">c</div>`, 1);
var root_43 = _$_.template(`<div class="b">b</div><!>`, 1);
var root_42 = _$_.template(`<div class="a">a</div><!>`, 1);
var root_45 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_41 = _$_.template(`<!><!>`, 1);
var root_49 = _$_.template(`<div class="c">c</div>`, 1);
var root_48 = _$_.template(`<div class="b">b</div><!>`, 1);
var root_47 = _$_.template(`<div class="a">a</div><!>`, 1);
var root_50 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_46 = _$_.template(`<!><!>`, 1);
var root_52 = _$_.template(`<div class="one">one</div>`, 1);
var root_54 = _$_.template(`<div class="two">two</div>`, 1);
var root_55 = _$_.template(`<div class="other">other</div>`, 1);
var root_53 = _$_.template(`<!>`, 1);
var root_56 = _$_.template(`<div class="never">never reached</div>`, 0);
var root_51 = _$_.template(`<!><!>`, 1);
var root_58 = _$_.template(`<div class="one">one</div>`, 1);
var root_60 = _$_.template(`<div class="two">two</div>`, 1);
var root_61 = _$_.template(`<div class="other">other</div>`, 1);
var root_59 = _$_.template(`<!>`, 1);
var root_62 = _$_.template(`<div class="never">never reached</div>`, 0);
var root_57 = _$_.template(`<!><!>`, 1);
var root_64 = _$_.template(`<div class="one">one</div>`, 1);
var root_66 = _$_.template(`<div class="two">two</div>`, 1);
var root_67 = _$_.template(`<div class="other">other</div>`, 1);
var root_65 = _$_.template(`<!>`, 1);
var root_68 = _$_.template(`<div class="never">never reached</div>`, 0);
var root_63 = _$_.template(`<!><!>`, 1);
var root_70 = _$_.template(`<div class="true">condition true</div>`, 1);
var root_71 = _$_.template(`<div class="false">condition false</div>`, 0);
var root_72 = _$_.template(`<div class="after">after if-else</div>`, 0);
var root_69 = _$_.template(`<!><!>`, 1);
var root_74 = _$_.template(`<div class="true">condition true</div>`, 1);
var root_75 = _$_.template(`<div class="false">condition false</div>`, 1);
var root_76 = _$_.template(`<div class="never">never reached</div>`, 0);
var root_73 = _$_.template(`<!><!>`, 1);
var root_78 = _$_.template(`<div class="guard">guard hit</div>`, 1);
var root_79 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_77 = _$_.template(`<button class="toggle">Toggle</button><!><!>`, 1);
var root_81 = _$_.template(`<div class="guard">guard hit</div>`, 1);
var root_82 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_80 = _$_.template(`<button class="toggle">Toggle</button><!><!>`, 1);
var root_85 = _$_.template(`<div class="b">b</div>`, 1);
var root_84 = _$_.template(`<div class="a">a</div><!>`, 1);
var root_86 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_83 = _$_.template(`<button class="toggle">Toggle</button><!><!>`, 1);
var root_88 = _$_.template(`<p class="inner">inner</p>`, 1);
var root_89 = _$_.template(`<div class="after">after</div>`, 0);
var root_87 = _$_.template(`<div class="outer"><span class="label">outer</span><!></div><!>`, 1);
var root_91 = _$_.template(`<div class="guard">guard</div><span class="guard-span">guard span</span>`, 1);
var root_92 = _$_.template(`<footer class="footer">footer</footer><nav class="nav">nav</nav>`, 1);
var root_90 = _$_.template(`<h1 class="title">title</h1><p class="desc">description</p><!><!>`, 1);
var root_94 = _$_.template(`<div class="early">early exit</div>`, 1);
var root_95 = _$_.template(`<div class="never1">never reached 1</div><div class="never2">never reached 2</div>`, 1);
var root_93 = _$_.template(`<!><!>`, 1);
var root_97 = _$_.template(`<div class="third">third</div>`, 1);
var root_96 = _$_.template(`<div class="first">first</div><div class="second">second</div><!>`, 1);
var root_99 = _$_.template(`<div class="mode-a">mode A</div>`, 1);
var root_101 = _$_.template(`<div class="mode-b">mode B</div>`, 1);
var root_100 = _$_.template(`<!>`, 1);
var root_103 = _$_.template(`<div class="mode-c">mode C</div>`, 1);
var root_102 = _$_.template(`<!>`, 1);
var root_104 = _$_.template(`<div class="default">default mode</div>`, 0);
var root_98 = _$_.template(`<!><!><!><!>`, 1);
var root_106 = _$_.template(`<div class="first">first guard</div>`, 1);
var root_108 = _$_.template(`<div class="second">second guard</div>`, 1);
var root_107 = _$_.template(`<!>`, 1);
var root_109 = _$_.template(`<div class="rest">rest</div>`, 0);
var root_105 = _$_.template(`<button class="toggle">Toggle</button><!><!><!>`, 1);
var root_112 = _$_.template(`<div class="b">b</div>`, 1);
var root_111 = _$_.template(`<div class="a">a</div><!>`, 1);
var root_113 = _$_.template(`<div class="rest"> </div>`, 0);
var root_110 = _$_.template(`<button class="toggle-a">Toggle A</button><button class="toggle-b">Toggle B</button><!><!>`, 1);
var root_115 = _$_.template(`<div class="zero">zero</div>`, 1);
var root_117 = _$_.template(`<div class="one">one</div>`, 1);
var root_116 = _$_.template(`<!>`, 1);
var root_118 = _$_.template(`<div class="rest">rest</div><div class="tail">tail</div>`, 1);
var root_114 = _$_.template(`<button class="toggle">Toggle</button><!><!>`, 1);
var root_120 = _$_.template(`<div class="hit-1">hit-1</div>`, 1);
var root_122 = _$_.template(`<div class="hit-2">hit-2</div>`, 1);
var root_124 = _$_.template(`<div class="hit-3">hit-3</div>`, 1);
var root_126 = _$_.template(`<div class="hit-4">hit-4</div>`, 1);
var root_125 = _$_.template(`<div class="nest-2-b">nest-2-b</div><!>`, 1);
var root_123 = _$_.template(`<div class="nest-1-b">nest-1-b</div><section class="nest-2"><div class="nest-2-a">nest-2-a</div><!><!></section>`, 1);
var root_121 = _$_.template(`<div class="middle">middle</div><section class="nest-1"><div class="nest-1-a">nest-1-a</div><!><!></section>`, 1);
var root_127 = _$_.template(`<div class="root-1">root-1</div><div class="root-2">root-2</div><div class="root-3">root-3</div><div class="root-4">root-4</div>`, 1);
var root_119 = _$_.template(`<button class="toggle-c1">Toggle C1</button><button class="toggle-c2">Toggle C2</button><button class="toggle-c3">Toggle C3</button><button class="toggle-c4">Toggle C4</button><div class="top">top</div><!><!><!>`, 1);

import { track } from 'ripple';

export function DirectReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r = false;
	var fragment = root();

	__r = true;

	var div_1 = _$_.first_child_frag(fragment);
	var node = _$_.sibling(div_1);

	var content = (__anchor) => {
		var div_2 = root_1();

		_$_.append(__anchor, div_2);
	};

	_$_.if(node, (__render) => {
		if (!__r) __render(content);
	});

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function ConditionalReturnTrue(__anchor, _, __block) {
	_$_.push_component();

	var __r_1 = false;
	let condition = true;
	var fragment_1 = root_2();
	var node_1 = _$_.first_child_frag(fragment_1);

	{
		var consequent = (__anchor) => {
			var fragment_2 = root_3();

			__r_1 = true;
			_$_.append(__anchor, fragment_2);
		};

		_$_.if(node_1, (__render) => {
			__r_1 = false;

			if (condition) __render(consequent);
		});
	}

	var node_2 = _$_.sibling(node_1);

	var content_1 = (__anchor) => {
		var div_3 = root_4();

		_$_.append(__anchor, div_3);
	};

	_$_.if(node_2, (__render) => {
		if (!__r_1) __render(content_1);
	});

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function ConditionalReturnFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_2 = false;
	let condition = false;
	var fragment_3 = root_5();
	var node_3 = _$_.first_child_frag(fragment_3);

	{
		var consequent_1 = (__anchor) => {
			var fragment_4 = root_6();

			__r_2 = true;
			_$_.append(__anchor, fragment_4);
		};

		_$_.if(node_3, (__render) => {
			__r_2 = false;

			if (condition) __render(consequent_1);
		});
	}

	var node_4 = _$_.sibling(node_3);

	var content_2 = (__anchor) => {
		var div_4 = root_7();

		_$_.append(__anchor, div_4);
	};

	_$_.if(node_4, (__render) => {
		if (!__r_2) __render(content_2);
	});

	_$_.append(__anchor, fragment_3);
	_$_.pop_component();
}

export function ContentBeforeAfterReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_3 = false;
	let shouldReturn = true;
	var fragment_5 = root_8();
	var div_5 = _$_.first_child_frag(fragment_5);
	var node_5 = _$_.sibling(div_5);

	{
		var consequent_2 = (__anchor) => {
			var fragment_6 = root_9();

			__r_3 = true;
			_$_.append(__anchor, fragment_6);
		};

		_$_.if(node_5, (__render) => {
			__r_3 = false;

			if (shouldReturn) __render(consequent_2);
		});
	}

	var node_6 = _$_.sibling(node_5);

	var content_3 = (__anchor) => {
		var div_6 = root_10();

		_$_.append(__anchor, div_6);
	};

	_$_.if(node_6, (__render) => {
		if (!__r_3) __render(content_3);
	});

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function MultipleElementsAfterGuard(__anchor, _, __block) {
	_$_.push_component();

	var __r_4 = false;
	let shouldReturn = false;
	var fragment_7 = root_11();
	var node_7 = _$_.first_child_frag(fragment_7);

	{
		var consequent_3 = (__anchor) => {
			var fragment_8 = root_12();

			__r_4 = true;
			_$_.append(__anchor, fragment_8);
		};

		_$_.if(node_7, (__render) => {
			__r_4 = false;

			if (shouldReturn) __render(consequent_3);
		});
	}

	var node_8 = _$_.sibling(node_7);

	var content_4 = (__anchor) => {
		var fragment_9 = root_13();

		_$_.next();
		_$_.append(__anchor, fragment_9, true);
	};

	_$_.if(node_8, (__render) => {
		if (!__r_4) __render(content_4);
	});

	_$_.append(__anchor, fragment_7);
	_$_.pop_component();
}

export function MultipleReturnsFirstHits(__anchor, _, __block) {
	_$_.push_component();

	var __r_6 = false;
	var __r_5 = false;
	let a = true;
	let b = true;
	var fragment_10 = root_14();
	var node_9 = _$_.first_child_frag(fragment_10);

	{
		var consequent_4 = (__anchor) => {
			var fragment_11 = root_15();

			__r_5 = true;
			_$_.append(__anchor, fragment_11);
		};

		_$_.if(node_9, (__render) => {
			__r_5 = false;

			if (a) __render(consequent_4);
		});
	}

	var node_10 = _$_.sibling(node_9);

	var content_5 = (__anchor) => {
		var fragment_12 = root_16();
		var node_11 = _$_.first_child_frag(fragment_12);

		{
			var consequent_5 = (__anchor) => {
				var fragment_13 = root_17();

				__r_6 = true;
				_$_.append(__anchor, fragment_13);
			};

			_$_.if(node_11, (__render) => {
				__r_6 = false;

				if (b) __render(consequent_5);
			});
		}

		_$_.append(__anchor, fragment_12);
	};

	_$_.if(node_10, (__render) => {
		if (!__r_5) __render(content_5);
	});

	var node_12 = _$_.sibling(node_10);

	var content_6 = (__anchor) => {
		var div_7 = root_18();

		_$_.append(__anchor, div_7);
	};

	_$_.if(node_12, (__render) => {
		if (!__r_5 && !__r_6) __render(content_6);
	});

	_$_.append(__anchor, fragment_10);
	_$_.pop_component();
}

export function MultipleReturnsSecondHits(__anchor, _, __block) {
	_$_.push_component();

	var __r_8 = false;
	var __r_7 = false;
	let a = false;
	let b = true;
	var fragment_14 = root_19();
	var node_13 = _$_.first_child_frag(fragment_14);

	{
		var consequent_6 = (__anchor) => {
			var fragment_15 = root_20();

			__r_7 = true;
			_$_.append(__anchor, fragment_15);
		};

		_$_.if(node_13, (__render) => {
			__r_7 = false;

			if (a) __render(consequent_6);
		});
	}

	var node_14 = _$_.sibling(node_13);

	var content_7 = (__anchor) => {
		var fragment_16 = root_21();
		var node_15 = _$_.first_child_frag(fragment_16);

		{
			var consequent_7 = (__anchor) => {
				var fragment_17 = root_22();

				__r_8 = true;
				_$_.append(__anchor, fragment_17);
			};

			_$_.if(node_15, (__render) => {
				__r_8 = false;

				if (b) __render(consequent_7);
			});
		}

		_$_.append(__anchor, fragment_16);
	};

	_$_.if(node_14, (__render) => {
		if (!__r_7) __render(content_7);
	});

	var node_16 = _$_.sibling(node_14);

	var content_8 = (__anchor) => {
		var div_8 = root_23();

		_$_.append(__anchor, div_8);
	};

	_$_.if(node_16, (__render) => {
		if (!__r_7 && !__r_8) __render(content_8);
	});

	_$_.append(__anchor, fragment_14);
	_$_.pop_component();
}

export function MultipleReturnsNoneHit(__anchor, _, __block) {
	_$_.push_component();

	var __r_10 = false;
	var __r_9 = false;
	let a = false;
	let b = false;
	var fragment_18 = root_24();
	var node_17 = _$_.first_child_frag(fragment_18);

	{
		var consequent_8 = (__anchor) => {
			var fragment_19 = root_25();

			__r_9 = true;
			_$_.append(__anchor, fragment_19);
		};

		_$_.if(node_17, (__render) => {
			__r_9 = false;

			if (a) __render(consequent_8);
		});
	}

	var node_18 = _$_.sibling(node_17);

	var content_9 = (__anchor) => {
		var fragment_20 = root_26();
		var node_19 = _$_.first_child_frag(fragment_20);

		{
			var consequent_9 = (__anchor) => {
				var fragment_21 = root_27();

				__r_10 = true;
				_$_.append(__anchor, fragment_21);
			};

			_$_.if(node_19, (__render) => {
				__r_10 = false;

				if (b) __render(consequent_9);
			});
		}

		_$_.append(__anchor, fragment_20);
	};

	_$_.if(node_18, (__render) => {
		if (!__r_9) __render(content_9);
	});

	var node_20 = _$_.sibling(node_18);

	var content_10 = (__anchor) => {
		var div_9 = root_28();

		_$_.append(__anchor, div_9);
	};

	_$_.if(node_20, (__render) => {
		if (!__r_9 && !__r_10) __render(content_10);
	});

	_$_.append(__anchor, fragment_18);
	_$_.pop_component();
}

export function NestedReturnsAllTrue(__anchor, _, __block) {
	_$_.push_component();

	var __r_11 = false;
	let a = true;
	let b = true;
	var fragment_22 = root_29();
	var node_21 = _$_.first_child_frag(fragment_22);

	{
		var consequent_11 = (__anchor) => {
			var fragment_23 = root_30();
			var div_10 = _$_.first_child_frag(fragment_23);
			var node_22 = _$_.sibling(div_10);

			{
				var consequent_10 = (__anchor) => {
					var fragment_24 = root_31();

					__r_11 = true;
					_$_.append(__anchor, fragment_24);
				};

				_$_.if(node_22, (__render) => {
					__r_11 = false;

					if (b) __render(consequent_10);
				});
			}

			_$_.append(__anchor, fragment_23);
		};

		_$_.if(node_21, (__render) => {
			__r_11 = false;

			if (a) __render(consequent_11);
		});
	}

	var node_23 = _$_.sibling(node_21);

	var content_11 = (__anchor) => {
		var div_11 = root_32();

		_$_.append(__anchor, div_11);
	};

	_$_.if(node_23, (__render) => {
		if (!__r_11) __render(content_11);
	});

	_$_.append(__anchor, fragment_22);
	_$_.pop_component();
}

export function NestedReturnsInnerFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_12 = false;
	let a = true;
	let b = false;
	var fragment_25 = root_33();
	var node_24 = _$_.first_child_frag(fragment_25);

	{
		var consequent_13 = (__anchor) => {
			var fragment_26 = root_34();
			var div_12 = _$_.first_child_frag(fragment_26);
			var node_25 = _$_.sibling(div_12);

			{
				var consequent_12 = (__anchor) => {
					var fragment_27 = root_35();

					__r_12 = true;
					_$_.append(__anchor, fragment_27);
				};

				_$_.if(node_25, (__render) => {
					__r_12 = false;

					if (b) __render(consequent_12);
				});
			}

			_$_.append(__anchor, fragment_26);
		};

		_$_.if(node_24, (__render) => {
			__r_12 = false;

			if (a) __render(consequent_13);
		});
	}

	var node_26 = _$_.sibling(node_24);

	var content_12 = (__anchor) => {
		var div_13 = root_36();

		_$_.append(__anchor, div_13);
	};

	_$_.if(node_26, (__render) => {
		if (!__r_12) __render(content_12);
	});

	_$_.append(__anchor, fragment_25);
	_$_.pop_component();
}

export function NestedReturnsOuterFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_13 = false;
	let a = false;
	let b = true;
	var fragment_28 = root_37();
	var node_27 = _$_.first_child_frag(fragment_28);

	{
		var consequent_15 = (__anchor) => {
			var fragment_29 = root_38();
			var div_14 = _$_.first_child_frag(fragment_29);
			var node_28 = _$_.sibling(div_14);

			{
				var consequent_14 = (__anchor) => {
					var fragment_30 = root_39();

					__r_13 = true;
					_$_.append(__anchor, fragment_30);
				};

				_$_.if(node_28, (__render) => {
					__r_13 = false;

					if (b) __render(consequent_14);
				});
			}

			_$_.append(__anchor, fragment_29);
		};

		_$_.if(node_27, (__render) => {
			__r_13 = false;

			if (a) __render(consequent_15);
		});
	}

	var node_29 = _$_.sibling(node_27);

	var content_13 = (__anchor) => {
		var div_15 = root_40();

		_$_.append(__anchor, div_15);
	};

	_$_.if(node_29, (__render) => {
		if (!__r_13) __render(content_13);
	});

	_$_.append(__anchor, fragment_28);
	_$_.pop_component();
}

export function DeeplyNestedReturnsAllTrue(__anchor, _, __block) {
	_$_.push_component();

	var __r_14 = false;
	let a = true;
	let b = true;
	let c = true;
	var fragment_31 = root_41();
	var node_30 = _$_.first_child_frag(fragment_31);

	{
		var consequent_18 = (__anchor) => {
			var fragment_32 = root_42();
			var div_16 = _$_.first_child_frag(fragment_32);
			var node_31 = _$_.sibling(div_16);

			{
				var consequent_17 = (__anchor) => {
					var fragment_33 = root_43();
					var div_17 = _$_.first_child_frag(fragment_33);
					var node_32 = _$_.sibling(div_17);

					{
						var consequent_16 = (__anchor) => {
							var fragment_34 = root_44();

							__r_14 = true;
							_$_.append(__anchor, fragment_34);
						};

						_$_.if(node_32, (__render) => {
							__r_14 = false;

							if (c) __render(consequent_16);
						});
					}

					_$_.append(__anchor, fragment_33);
				};

				_$_.if(node_31, (__render) => {
					__r_14 = false;

					if (b) __render(consequent_17);
				});
			}

			_$_.append(__anchor, fragment_32);
		};

		_$_.if(node_30, (__render) => {
			__r_14 = false;

			if (a) __render(consequent_18);
		});
	}

	var node_33 = _$_.sibling(node_30);

	var content_14 = (__anchor) => {
		var div_18 = root_45();

		_$_.append(__anchor, div_18);
	};

	_$_.if(node_33, (__render) => {
		if (!__r_14) __render(content_14);
	});

	_$_.append(__anchor, fragment_31);
	_$_.pop_component();
}

export function DeeplyNestedReturnsInnermostFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_15 = false;
	let a = true;
	let b = true;
	let c = false;
	var fragment_35 = root_46();
	var node_34 = _$_.first_child_frag(fragment_35);

	{
		var consequent_21 = (__anchor) => {
			var fragment_36 = root_47();
			var div_19 = _$_.first_child_frag(fragment_36);
			var node_35 = _$_.sibling(div_19);

			{
				var consequent_20 = (__anchor) => {
					var fragment_37 = root_48();
					var div_20 = _$_.first_child_frag(fragment_37);
					var node_36 = _$_.sibling(div_20);

					{
						var consequent_19 = (__anchor) => {
							var fragment_38 = root_49();

							__r_15 = true;
							_$_.append(__anchor, fragment_38);
						};

						_$_.if(node_36, (__render) => {
							__r_15 = false;

							if (c) __render(consequent_19);
						});
					}

					_$_.append(__anchor, fragment_37);
				};

				_$_.if(node_35, (__render) => {
					__r_15 = false;

					if (b) __render(consequent_20);
				});
			}

			_$_.append(__anchor, fragment_36);
		};

		_$_.if(node_34, (__render) => {
			__r_15 = false;

			if (a) __render(consequent_21);
		});
	}

	var node_37 = _$_.sibling(node_34);

	var content_15 = (__anchor) => {
		var div_21 = root_50();

		_$_.append(__anchor, div_21);
	};

	_$_.if(node_37, (__render) => {
		if (!__r_15) __render(content_15);
	});

	_$_.append(__anchor, fragment_35);
	_$_.pop_component();
}

export function ElseIfChainFirst(__anchor, _, __block) {
	_$_.push_component();

	var __r_18 = false;
	var __r_17 = false;
	var __r_16 = false;
	let value = 1;
	var fragment_39 = root_51();
	var node_38 = _$_.first_child_frag(fragment_39);

	{
		var consequent_22 = (__anchor) => {
			var fragment_40 = root_52();

			__r_16 = true;
			_$_.append(__anchor, fragment_40);
		};

		var alternate_1 = (__anchor) => {
			var fragment_41 = root_53();
			var node_39 = _$_.first_child_frag(fragment_41);

			{
				var consequent_23 = (__anchor) => {
					var fragment_42 = root_54();

					__r_17 = true;
					_$_.append(__anchor, fragment_42);
				};

				var alternate = (__anchor) => {
					var fragment_43 = root_55();

					__r_18 = true;
					_$_.append(__anchor, fragment_43);
				};

				_$_.if(node_39, (__render) => {
					__r_17 = false;
					__r_18 = false;
					__r_17 = false;
					__r_18 = false;

					if (value === 2) __render(consequent_23); else __render(alternate, false);
				});
			}

			_$_.append(__anchor, fragment_41);
		};

		_$_.if(node_38, (__render) => {
			__r_16 = false;
			__r_17 = false;
			__r_18 = false;
			__r_16 = false;
			__r_17 = false;
			__r_18 = false;

			if (value === 1) __render(consequent_22); else __render(alternate_1, false);
		});
	}

	var node_40 = _$_.sibling(node_38);

	var content_16 = (__anchor) => {
		var div_22 = root_56();

		_$_.append(__anchor, div_22);
	};

	_$_.if(node_40, (__render) => {
		if (!__r_16 && !__r_17 && !__r_18) __render(content_16);
	});

	_$_.append(__anchor, fragment_39);
	_$_.pop_component();
}

export function ElseIfChainSecond(__anchor, _, __block) {
	_$_.push_component();

	var __r_21 = false;
	var __r_20 = false;
	var __r_19 = false;
	let value = 2;
	var fragment_44 = root_57();
	var node_41 = _$_.first_child_frag(fragment_44);

	{
		var consequent_24 = (__anchor) => {
			var fragment_45 = root_58();

			__r_19 = true;
			_$_.append(__anchor, fragment_45);
		};

		var alternate_3 = (__anchor) => {
			var fragment_46 = root_59();
			var node_42 = _$_.first_child_frag(fragment_46);

			{
				var consequent_25 = (__anchor) => {
					var fragment_47 = root_60();

					__r_20 = true;
					_$_.append(__anchor, fragment_47);
				};

				var alternate_2 = (__anchor) => {
					var fragment_48 = root_61();

					__r_21 = true;
					_$_.append(__anchor, fragment_48);
				};

				_$_.if(node_42, (__render) => {
					__r_20 = false;
					__r_21 = false;
					__r_20 = false;
					__r_21 = false;

					if (value === 2) __render(consequent_25); else __render(alternate_2, false);
				});
			}

			_$_.append(__anchor, fragment_46);
		};

		_$_.if(node_41, (__render) => {
			__r_19 = false;
			__r_20 = false;
			__r_21 = false;
			__r_19 = false;
			__r_20 = false;
			__r_21 = false;

			if (value === 1) __render(consequent_24); else __render(alternate_3, false);
		});
	}

	var node_43 = _$_.sibling(node_41);

	var content_17 = (__anchor) => {
		var div_23 = root_62();

		_$_.append(__anchor, div_23);
	};

	_$_.if(node_43, (__render) => {
		if (!__r_19 && !__r_20 && !__r_21) __render(content_17);
	});

	_$_.append(__anchor, fragment_44);
	_$_.pop_component();
}

export function ElseIfChainElse(__anchor, _, __block) {
	_$_.push_component();

	var __r_24 = false;
	var __r_23 = false;
	var __r_22 = false;
	let value = 3;
	var fragment_49 = root_63();
	var node_44 = _$_.first_child_frag(fragment_49);

	{
		var consequent_26 = (__anchor) => {
			var fragment_50 = root_64();

			__r_22 = true;
			_$_.append(__anchor, fragment_50);
		};

		var alternate_5 = (__anchor) => {
			var fragment_51 = root_65();
			var node_45 = _$_.first_child_frag(fragment_51);

			{
				var consequent_27 = (__anchor) => {
					var fragment_52 = root_66();

					__r_23 = true;
					_$_.append(__anchor, fragment_52);
				};

				var alternate_4 = (__anchor) => {
					var fragment_53 = root_67();

					__r_24 = true;
					_$_.append(__anchor, fragment_53);
				};

				_$_.if(node_45, (__render) => {
					__r_23 = false;
					__r_24 = false;
					__r_23 = false;
					__r_24 = false;

					if (value === 2) __render(consequent_27); else __render(alternate_4, false);
				});
			}

			_$_.append(__anchor, fragment_51);
		};

		_$_.if(node_44, (__render) => {
			__r_22 = false;
			__r_23 = false;
			__r_24 = false;
			__r_22 = false;
			__r_23 = false;
			__r_24 = false;

			if (value === 1) __render(consequent_26); else __render(alternate_5, false);
		});
	}

	var node_46 = _$_.sibling(node_44);

	var content_18 = (__anchor) => {
		var div_24 = root_68();

		_$_.append(__anchor, div_24);
	};

	_$_.if(node_46, (__render) => {
		if (!__r_22 && !__r_23 && !__r_24) __render(content_18);
	});

	_$_.append(__anchor, fragment_49);
	_$_.pop_component();
}

export function ReturnWithElseNoReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_25 = false;
	let condition = false;
	var fragment_54 = root_69();
	var node_47 = _$_.first_child_frag(fragment_54);

	{
		var consequent_28 = (__anchor) => {
			var fragment_55 = root_70();

			__r_25 = true;
			_$_.append(__anchor, fragment_55);
		};

		var alternate_6 = (__anchor) => {
			var div_25 = root_71();

			_$_.append(__anchor, div_25);
		};

		_$_.if(node_47, (__render) => {
			__r_25 = false;
			__r_25 = false;

			if (condition) __render(consequent_28); else __render(alternate_6, false);
		});
	}

	var node_48 = _$_.sibling(node_47);

	var content_19 = (__anchor) => {
		var div_26 = root_72();

		_$_.append(__anchor, div_26);
	};

	_$_.if(node_48, (__render) => {
		if (!__r_25) __render(content_19);
	});

	_$_.append(__anchor, fragment_54);
	_$_.pop_component();
}

export function ReturnWithElseBothReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_27 = false;
	var __r_26 = false;
	let condition = false;
	var fragment_56 = root_73();
	var node_49 = _$_.first_child_frag(fragment_56);

	{
		var consequent_29 = (__anchor) => {
			var fragment_57 = root_74();

			__r_26 = true;
			_$_.append(__anchor, fragment_57);
		};

		var alternate_7 = (__anchor) => {
			var fragment_58 = root_75();

			__r_27 = true;
			_$_.append(__anchor, fragment_58);
		};

		_$_.if(node_49, (__render) => {
			__r_26 = false;
			__r_27 = false;
			__r_26 = false;
			__r_27 = false;

			if (condition) __render(consequent_29); else __render(alternate_7, false);
		});
	}

	var node_50 = _$_.sibling(node_49);

	var content_20 = (__anchor) => {
		var div_27 = root_76();

		_$_.append(__anchor, div_27);
	};

	_$_.if(node_50, (__render) => {
		if (!__r_26 && !__r_27) __render(content_20);
	});

	_$_.append(__anchor, fragment_56);
	_$_.pop_component();
}

export function ReactiveReturnTrueToFalse(__anchor, _, __block) {
	_$_.push_component();

	var __r_28 = _$_.tracked(false);
	let condition = track(true, void 0, void 0, __block);
	var fragment_59 = root_77();
	var button_1 = _$_.first_child_frag(fragment_59);

	button_1.__click = () => {
		_$_.set(condition, !_$_.get(condition));
	};

	var node_51 = _$_.sibling(button_1);

	{
		var consequent_30 = (__anchor) => {
			var fragment_60 = root_78();

			_$_.set(__r_28, true);
			_$_.append(__anchor, fragment_60);
		};

		_$_.if(node_51, (__render) => {
			_$_.set(__r_28, false);

			if (_$_.get(condition)) __render(consequent_30);
		});
	}

	var node_52 = _$_.sibling(node_51);

	var content_21 = (__anchor) => {
		var div_28 = root_79();

		_$_.append(__anchor, div_28);
	};

	_$_.if(node_52, (__render) => {
		if (!_$_.get(__r_28)) __render(content_21);
	});

	_$_.append(__anchor, fragment_59);
	_$_.pop_component();
}

export function ReactiveReturnFalseToTrue(__anchor, _, __block) {
	_$_.push_component();

	var __r_29 = _$_.tracked(false);
	let condition = track(false, void 0, void 0, __block);
	var fragment_61 = root_80();
	var button_2 = _$_.first_child_frag(fragment_61);

	button_2.__click = () => {
		_$_.set(condition, !_$_.get(condition));
	};

	var node_53 = _$_.sibling(button_2);

	{
		var consequent_31 = (__anchor) => {
			var fragment_62 = root_81();

			_$_.set(__r_29, true);
			_$_.append(__anchor, fragment_62);
		};

		_$_.if(node_53, (__render) => {
			_$_.set(__r_29, false);

			if (_$_.get(condition)) __render(consequent_31);
		});
	}

	var node_54 = _$_.sibling(node_53);

	var content_22 = (__anchor) => {
		var div_29 = root_82();

		_$_.append(__anchor, div_29);
	};

	_$_.if(node_54, (__render) => {
		if (!_$_.get(__r_29)) __render(content_22);
	});

	_$_.append(__anchor, fragment_61);
	_$_.pop_component();
}

export function ReactiveNestedReturn(__anchor, _, __block) {
	_$_.push_component();

	var __r_30 = _$_.tracked(false);
	let a = true;
	let b = track(true, void 0, void 0, __block);
	var fragment_63 = root_83();
	var button_3 = _$_.first_child_frag(fragment_63);

	button_3.__click = () => {
		_$_.set(b, !_$_.get(b));
	};

	var node_55 = _$_.sibling(button_3);

	{
		var consequent_33 = (__anchor) => {
			var fragment_64 = root_84();
			var div_30 = _$_.first_child_frag(fragment_64);
			var node_56 = _$_.sibling(div_30);

			{
				var consequent_32 = (__anchor) => {
					var fragment_65 = root_85();

					_$_.set(__r_30, true);
					_$_.append(__anchor, fragment_65);
				};

				_$_.if(node_56, (__render) => {
					_$_.set(__r_30, false);

					if (_$_.get(b)) __render(consequent_32);
				});
			}

			_$_.append(__anchor, fragment_64);
		};

		_$_.if(node_55, (__render) => {
			_$_.set(__r_30, false);

			if (a) __render(consequent_33);
		});
	}

	var node_57 = _$_.sibling(node_55);

	var content_23 = (__anchor) => {
		var div_31 = root_86();

		_$_.append(__anchor, div_31);
	};

	_$_.if(node_57, (__render) => {
		if (!_$_.get(__r_30)) __render(content_23);
	});

	_$_.append(__anchor, fragment_63);
	_$_.pop_component();
}

export function ReturnInNestedElement(__anchor, _, __block) {
	_$_.push_component();

	var __r_31 = false;
	let show = true;
	var fragment_66 = root_87();
	var div_32 = _$_.first_child_frag(fragment_66);

	{
		var span_1 = _$_.child(div_32);
		var node_58 = _$_.sibling(span_1);

		{
			var consequent_34 = (__anchor) => {
				var fragment_67 = root_88();

				__r_31 = true;
				_$_.append(__anchor, fragment_67);
			};

			_$_.if(node_58, (__render) => {
				__r_31 = false;

				if (show) __render(consequent_34);
			});
		}

		_$_.pop(div_32);
	}

	var node_59 = _$_.sibling(div_32);

	var content_24 = (__anchor) => {
		var div_33 = root_89();

		_$_.append(__anchor, div_33);
	};

	_$_.if(node_59, (__render) => {
		if (!__r_31) __render(content_24);
	});

	_$_.append(__anchor, fragment_66);
	_$_.pop_component();
}

export function ReturnWithMultipleElements(__anchor, _, __block) {
	_$_.push_component();

	var __r_32 = false;
	let shouldReturn = true;
	var fragment_68 = root_90();
	var h1_1 = _$_.first_child_frag(fragment_68);
	var p_1 = _$_.sibling(h1_1);
	var node_60 = _$_.sibling(p_1);

	{
		var consequent_35 = (__anchor) => {
			var fragment_69 = root_91();

			__r_32 = true;
			_$_.next();
			_$_.append(__anchor, fragment_69, true);
		};

		_$_.if(node_60, (__render) => {
			__r_32 = false;

			if (shouldReturn) __render(consequent_35);
		});
	}

	var node_61 = _$_.sibling(node_60);

	var content_25 = (__anchor) => {
		var fragment_70 = root_92();

		_$_.next();
		_$_.append(__anchor, fragment_70, true);
	};

	_$_.if(node_61, (__render) => {
		if (!__r_32) __render(content_25);
	});

	_$_.append(__anchor, fragment_68);
	_$_.pop_component();
}

export function ReturnAtBeginning(__anchor, _, __block) {
	_$_.push_component();

	var __r_33 = false;
	var fragment_71 = root_93();
	var node_62 = _$_.first_child_frag(fragment_71);

	{
		var consequent_36 = (__anchor) => {
			var fragment_72 = root_94();

			__r_33 = true;
			_$_.append(__anchor, fragment_72);
		};

		_$_.if(node_62, (__render) => {
			__r_33 = false;

			if (true) __render(consequent_36);
		});
	}

	var node_63 = _$_.sibling(node_62);

	var content_26 = (__anchor) => {
		var fragment_73 = root_95();

		_$_.next();
		_$_.append(__anchor, fragment_73, true);
	};

	_$_.if(node_63, (__render) => {
		if (!__r_33) __render(content_26);
	});

	_$_.append(__anchor, fragment_71);
	_$_.pop_component();
}

export function ReturnAtEnd(__anchor, _, __block) {
	_$_.push_component();

	var __r_34 = false;
	var fragment_74 = root_96();
	var div_35 = _$_.first_child_frag(fragment_74);
	var div_34 = _$_.sibling(div_35);
	var node_64 = _$_.sibling(div_34);

	{
		var consequent_37 = (__anchor) => {
			var fragment_75 = root_97();

			__r_34 = true;
			_$_.append(__anchor, fragment_75);
		};

		_$_.if(node_64, (__render) => {
			__r_34 = false;

			if (true) __render(consequent_37);
		});
	}

	_$_.append(__anchor, fragment_74);
	_$_.pop_component();
}

export function MultipleSiblingReturns(__anchor, _, __block) {
	_$_.push_component();

	var __r_37 = false;
	var __r_36 = false;
	var __r_35 = false;
	let mode = 'b';
	var fragment_76 = root_98();
	var node_65 = _$_.first_child_frag(fragment_76);

	{
		var consequent_38 = (__anchor) => {
			var fragment_77 = root_99();

			__r_35 = true;
			_$_.append(__anchor, fragment_77);
		};

		_$_.if(node_65, (__render) => {
			__r_35 = false;

			if (mode === 'a') __render(consequent_38);
		});
	}

	var node_66 = _$_.sibling(node_65);

	var content_27 = (__anchor) => {
		var fragment_78 = root_100();
		var node_67 = _$_.first_child_frag(fragment_78);

		{
			var consequent_39 = (__anchor) => {
				var fragment_79 = root_101();

				__r_36 = true;
				_$_.append(__anchor, fragment_79);
			};

			_$_.if(node_67, (__render) => {
				__r_36 = false;

				if (mode === 'b') __render(consequent_39);
			});
		}

		_$_.append(__anchor, fragment_78);
	};

	_$_.if(node_66, (__render) => {
		if (!__r_35) __render(content_27);
	});

	var node_68 = _$_.sibling(node_66);

	var content_28 = (__anchor) => {
		var fragment_80 = root_102();
		var node_69 = _$_.first_child_frag(fragment_80);

		{
			var consequent_40 = (__anchor) => {
				var fragment_81 = root_103();

				__r_37 = true;
				_$_.append(__anchor, fragment_81);
			};

			_$_.if(node_69, (__render) => {
				__r_37 = false;

				if (mode === 'c') __render(consequent_40);
			});
		}

		_$_.append(__anchor, fragment_80);
	};

	_$_.if(node_68, (__render) => {
		if (!__r_35 && !__r_36) __render(content_28);
	});

	var node_70 = _$_.sibling(node_68);

	var content_29 = (__anchor) => {
		var div_36 = root_104();

		_$_.append(__anchor, div_36);
	};

	_$_.if(node_70, (__render) => {
		if (!__r_35 && !__r_36 && !__r_37) __render(content_29);
	});

	_$_.append(__anchor, fragment_76);
	_$_.pop_component();
}

export function ReactiveSiblingReturns(__anchor, _, __block) {
	_$_.push_component();

	var __r_39 = _$_.tracked(false);
	var __r_38 = _$_.tracked(false);
	let mode = track('first', void 0, void 0, __block);
	var fragment_82 = root_105();
	var button_4 = _$_.first_child_frag(fragment_82);

	button_4.__click = () => {
		if (_$_.get(mode) === 'first') {
			_$_.set(mode, 'second');
		} else if (_$_.get(mode) === 'second') {
			_$_.set(mode, 'none');
		} else {
			_$_.set(mode, 'first');
		}
	};

	var node_71 = _$_.sibling(button_4);

	{
		var consequent_41 = (__anchor) => {
			var fragment_83 = root_106();

			_$_.set(__r_38, true);
			_$_.append(__anchor, fragment_83);
		};

		_$_.if(node_71, (__render) => {
			_$_.set(__r_38, false);

			if (_$_.get(mode) === 'first') __render(consequent_41);
		});
	}

	var node_72 = _$_.sibling(node_71);

	var content_30 = (__anchor) => {
		var fragment_84 = root_107();
		var node_73 = _$_.first_child_frag(fragment_84);

		{
			var consequent_42 = (__anchor) => {
				var fragment_85 = root_108();

				_$_.set(__r_39, true);
				_$_.append(__anchor, fragment_85);
			};

			_$_.if(node_73, (__render) => {
				_$_.set(__r_39, false);

				if (_$_.get(mode) === 'second') __render(consequent_42);
			});
		}

		_$_.append(__anchor, fragment_84);
	};

	_$_.if(node_72, (__render) => {
		if (!_$_.get(__r_38)) __render(content_30);
	});

	var node_74 = _$_.sibling(node_72);

	var content_31 = (__anchor) => {
		var div_37 = root_109();

		_$_.append(__anchor, div_37);
	};

	_$_.if(node_74, (__render) => {
		if (!_$_.get(__r_38) && !_$_.get(__r_39)) __render(content_31);
	});

	_$_.append(__anchor, fragment_82);
	_$_.pop_component();
}

export function ReactiveOuterInnerReturns(__anchor, _, __block) {
	_$_.push_component();

	var __r_40 = _$_.tracked(false);
	let a = track(true, void 0, void 0, __block);
	let b = track(true, void 0, void 0, __block);
	var fragment_86 = root_110();
	var button_5 = _$_.first_child_frag(fragment_86);

	button_5.__click = () => {
		_$_.set(a, !_$_.get(a));
	};

	var button_6 = _$_.sibling(button_5);

	button_6.__click = () => {
		_$_.set(b, !_$_.get(b));
	};

	var node_75 = _$_.sibling(button_6);

	{
		var consequent_44 = (__anchor) => {
			var fragment_87 = root_111();
			var div_38 = _$_.first_child_frag(fragment_87);
			var node_76 = _$_.sibling(div_38);

			{
				var consequent_43 = (__anchor) => {
					var fragment_88 = root_112();

					_$_.set(__r_40, true);
					_$_.append(__anchor, fragment_88);
				};

				_$_.if(node_76, (__render) => {
					_$_.set(__r_40, false);

					if (_$_.get(b)) __render(consequent_43);
				});
			}

			_$_.append(__anchor, fragment_87);
		};

		_$_.if(node_75, (__render) => {
			_$_.set(__r_40, false);

			if (_$_.get(a)) __render(consequent_44);
		});
	}

	var node_77 = _$_.sibling(node_75);

	var content_32 = (__anchor) => {
		var div_39 = root_113();

		{
			var text = _$_.child(div_39, true);

			_$_.pop(div_39);
		}

		_$_.render(() => {
			_$_.set_text(text, _$_.get(a) ? 'a-on rest' : 'a-off rest');
		});

		_$_.append(__anchor, div_39);
	};

	_$_.if(node_77, (__render) => {
		if (!_$_.get(__r_40)) __render(content_32);
	});

	_$_.append(__anchor, fragment_86);
	_$_.pop_component();
}

export function ReactiveElseIfReturns(__anchor, _, __block) {
	_$_.push_component();

	var __r_42 = _$_.tracked(false);
	var __r_41 = _$_.tracked(false);
	let status = track(0, void 0, void 0, __block);
	var fragment_89 = root_114();
	var button_7 = _$_.first_child_frag(fragment_89);

	button_7.__click = () => {
		_$_.set(status, (_$_.get(status) + 1) % 3);
	};

	var node_78 = _$_.sibling(button_7);

	{
		var consequent_45 = (__anchor) => {
			var fragment_90 = root_115();

			_$_.set(__r_41, true);
			_$_.append(__anchor, fragment_90);
		};

		var alternate_8 = (__anchor) => {
			var fragment_91 = root_116();
			var node_79 = _$_.first_child_frag(fragment_91);

			{
				var consequent_46 = (__anchor) => {
					var fragment_92 = root_117();

					_$_.set(__r_42, true);
					_$_.append(__anchor, fragment_92);
				};

				_$_.if(node_79, (__render) => {
					_$_.set(__r_42, false);

					if (_$_.get(status) === 1) __render(consequent_46);
				});
			}

			_$_.append(__anchor, fragment_91);
		};

		_$_.if(node_78, (__render) => {
			_$_.set(__r_41, false);
			_$_.set(__r_42, false);
			_$_.set(__r_41, false);
			_$_.set(__r_42, false);

			if (_$_.get(status) === 0) __render(consequent_45); else __render(alternate_8, false);
		});
	}

	var node_80 = _$_.sibling(node_78);

	var content_33 = (__anchor) => {
		var fragment_93 = root_118();

		_$_.next();
		_$_.append(__anchor, fragment_93, true);
	};

	_$_.if(node_80, (__render) => {
		if (!_$_.get(__r_41) && !_$_.get(__r_42)) __render(content_33);
	});

	_$_.append(__anchor, fragment_89);
	_$_.pop_component();
}

export function ReactiveDeepNestedIndependentReturns(__anchor, _, __block) {
	_$_.push_component();

	var __r_46 = _$_.tracked(false);
	var __r_45 = _$_.tracked(false);
	var __r_44 = _$_.tracked(false);
	var __r_43 = _$_.tracked(false);
	let c1 = track(false, void 0, void 0, __block);
	let c2 = track(false, void 0, void 0, __block);
	let c3 = track(false, void 0, void 0, __block);
	let c4 = track(false, void 0, void 0, __block);
	var fragment_94 = root_119();
	var button_8 = _$_.first_child_frag(fragment_94);

	button_8.__click = () => {
		_$_.set(c1, !_$_.get(c1));
	};

	var button_9 = _$_.sibling(button_8);

	button_9.__click = () => {
		_$_.set(c2, !_$_.get(c2));
	};

	var button_10 = _$_.sibling(button_9);

	button_10.__click = () => {
		_$_.set(c3, !_$_.get(c3));
	};

	var button_11 = _$_.sibling(button_10);

	button_11.__click = () => {
		_$_.set(c4, !_$_.get(c4));
	};

	var div_40 = _$_.sibling(button_11);
	var node_81 = _$_.sibling(div_40);

	{
		var consequent_47 = (__anchor) => {
			var fragment_95 = root_120();

			_$_.set(__r_43, true);
			_$_.append(__anchor, fragment_95);
		};

		_$_.if(node_81, (__render) => {
			_$_.set(__r_43, false);

			if (_$_.get(c1)) __render(consequent_47);
		});
	}

	var node_82 = _$_.sibling(node_81);

	var content_36 = (__anchor) => {
		var fragment_96 = root_121();
		var div_42 = _$_.first_child_frag(fragment_96);
		var section_1 = _$_.sibling(div_42);

		{
			var div_41 = _$_.child(section_1);
			var node_83 = _$_.sibling(div_41);

			{
				var consequent_48 = (__anchor) => {
					var fragment_97 = root_122();

					_$_.set(__r_44, true);
					_$_.append(__anchor, fragment_97);
				};

				_$_.if(node_83, (__render) => {
					_$_.set(__r_44, false);

					if (_$_.get(c2)) __render(consequent_48);
				});
			}

			var node_84 = _$_.sibling(node_83);

			var content_35 = (__anchor) => {
				var fragment_98 = root_123();
				var div_44 = _$_.first_child_frag(fragment_98);
				var section_2 = _$_.sibling(div_44);

				{
					var div_43 = _$_.child(section_2);
					var node_85 = _$_.sibling(div_43);

					{
						var consequent_49 = (__anchor) => {
							var fragment_99 = root_124();

							_$_.set(__r_45, true);
							_$_.append(__anchor, fragment_99);
						};

						_$_.if(node_85, (__render) => {
							_$_.set(__r_45, false);

							if (_$_.get(c3)) __render(consequent_49);
						});
					}

					var node_86 = _$_.sibling(node_85);

					var content_34 = (__anchor) => {
						var fragment_100 = root_125();
						var div_45 = _$_.first_child_frag(fragment_100);
						var node_87 = _$_.sibling(div_45);

						{
							var consequent_50 = (__anchor) => {
								var fragment_101 = root_126();

								_$_.set(__r_46, true);
								_$_.append(__anchor, fragment_101);
							};

							_$_.if(node_87, (__render) => {
								_$_.set(__r_46, false);

								if (_$_.get(c4)) __render(consequent_50);
							});
						}

						_$_.append(__anchor, fragment_100);
					};

					_$_.if(node_86, (__render) => {
						if (!_$_.get(__r_45)) __render(content_34);
					});

					_$_.pop(section_2);
				}

				_$_.append(__anchor, fragment_98);
			};

			_$_.if(node_84, (__render) => {
				if (!_$_.get(__r_44)) __render(content_35);
			});

			_$_.pop(section_1);
		}

		_$_.next();
		_$_.append(__anchor, fragment_96, true);
	};

	_$_.if(node_82, (__render) => {
		if (!_$_.get(__r_43)) __render(content_36);
	});

	var node_88 = _$_.sibling(node_82);

	var content_37 = (__anchor) => {
		var fragment_102 = root_127();

		_$_.next(3);
		_$_.append(__anchor, fragment_102, true);
	};

	_$_.if(node_88, (__render) => {
		if (!_$_.get(__r_43) && !_$_.get(__r_44) && !_$_.get(__r_45) && !_$_.get(__r_46)) __render(content_37);
	});

	_$_.append(__anchor, fragment_94);
	_$_.pop_component();
}

_$_.delegate(['click']);
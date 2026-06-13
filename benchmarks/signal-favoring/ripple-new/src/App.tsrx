import { useState } from 'ripple-new';

// 100 uniquely-named components in a chain. Stateful counters at C1, C11, C21, C31, C41, C51, C61, C71, C81, C91.
// hook-frameworks cascade re-renders down the chain on each bump.

let _set1 = null;
let _set11 = null;
let _set21 = null;
let _set31 = null;
let _set41 = null;
let _set51 = null;
let _set61 = null;
let _set71 = null;
let _set81 = null;
let _set91 = null;

export function bumpAt1() {
	if (_set1) _set1((v) => v + 1);
}
export function bumpAt11() {
	if (_set11) _set11((v) => v + 1);
}
export function bumpAt21() {
	if (_set21) _set21((v) => v + 1);
}
export function bumpAt31() {
	if (_set31) _set31((v) => v + 1);
}
export function bumpAt41() {
	if (_set41) _set41((v) => v + 1);
}
export function bumpAt51() {
	if (_set51) _set51((v) => v + 1);
}
export function bumpAt61() {
	if (_set61) _set61((v) => v + 1);
}
export function bumpAt71() {
	if (_set71) _set71((v) => v + 1);
}
export function bumpAt81() {
	if (_set81) _set81((v) => v + 1);
}
export function bumpAt91() {
	if (_set91) _set91((v) => v + 1);
}

function C100(props) @{
	<span class="leaf">100</span>
}
function C99(props) @{
	<div class="c">
		99
		<C100 />
	</div>
}
function C98(props) @{
	<div class="c">
		98
		<C99 />
	</div>
}
function C97(props) @{
	<div class="c">
		97
		<C98 />
	</div>
}
function C96(props) @{
	<div class="c">
		96
		<C97 />
	</div>
}
function C95(props) @{
	<div class="c">
		95
		<C96 />
	</div>
}
function C94(props) @{
	<div class="c">
		94
		<C95 />
	</div>
}
function C93(props) @{
	<div class="c">
		93
		<C94 />
	</div>
}
function C92(props) @{
	<div class="c">
		92
		<C93 />
	</div>
}
function C91(props) @{
	const [v, set] = useState(0);
	_set91 = set;
	<div class="c">
		91:
		{v as number}

		<C92 />
	</div>
}
function C90(props) @{
	<div class="c">
		90
		<C91 />
	</div>
}
function C89(props) @{
	<div class="c">
		89
		<C90 />
	</div>
}
function C88(props) @{
	<div class="c">
		88
		<C89 />
	</div>
}
function C87(props) @{
	<div class="c">
		87
		<C88 />
	</div>
}
function C86(props) @{
	<div class="c">
		86
		<C87 />
	</div>
}
function C85(props) @{
	<div class="c">
		85
		<C86 />
	</div>
}
function C84(props) @{
	<div class="c">
		84
		<C85 />
	</div>
}
function C83(props) @{
	<div class="c">
		83
		<C84 />
	</div>
}
function C82(props) @{
	<div class="c">
		82
		<C83 />
	</div>
}
function C81(props) @{
	const [v, set] = useState(0);
	_set81 = set;
	<div class="c">
		81:
		{v as number}

		<C82 />
	</div>
}
function C80(props) @{
	<div class="c">
		80
		<C81 />
	</div>
}
function C79(props) @{
	<div class="c">
		79
		<C80 />
	</div>
}
function C78(props) @{
	<div class="c">
		78
		<C79 />
	</div>
}
function C77(props) @{
	<div class="c">
		77
		<C78 />
	</div>
}
function C76(props) @{
	<div class="c">
		76
		<C77 />
	</div>
}
function C75(props) @{
	<div class="c">
		75
		<C76 />
	</div>
}
function C74(props) @{
	<div class="c">
		74
		<C75 />
	</div>
}
function C73(props) @{
	<div class="c">
		73
		<C74 />
	</div>
}
function C72(props) @{
	<div class="c">
		72
		<C73 />
	</div>
}
function C71(props) @{
	const [v, set] = useState(0);
	_set71 = set;
	<div class="c">
		71:
		{v as number}

		<C72 />
	</div>
}
function C70(props) @{
	<div class="c">
		70
		<C71 />
	</div>
}
function C69(props) @{
	<div class="c">
		69
		<C70 />
	</div>
}
function C68(props) @{
	<div class="c">
		68
		<C69 />
	</div>
}
function C67(props) @{
	<div class="c">
		67
		<C68 />
	</div>
}
function C66(props) @{
	<div class="c">
		66
		<C67 />
	</div>
}
function C65(props) @{
	<div class="c">
		65
		<C66 />
	</div>
}
function C64(props) @{
	<div class="c">
		64
		<C65 />
	</div>
}
function C63(props) @{
	<div class="c">
		63
		<C64 />
	</div>
}
function C62(props) @{
	<div class="c">
		62
		<C63 />
	</div>
}
function C61(props) @{
	const [v, set] = useState(0);
	_set61 = set;
	<div class="c">
		61:
		{v as number}

		<C62 />
	</div>
}
function C60(props) @{
	<div class="c">
		60
		<C61 />
	</div>
}
function C59(props) @{
	<div class="c">
		59
		<C60 />
	</div>
}
function C58(props) @{
	<div class="c">
		58
		<C59 />
	</div>
}
function C57(props) @{
	<div class="c">
		57
		<C58 />
	</div>
}
function C56(props) @{
	<div class="c">
		56
		<C57 />
	</div>
}
function C55(props) @{
	<div class="c">
		55
		<C56 />
	</div>
}
function C54(props) @{
	<div class="c">
		54
		<C55 />
	</div>
}
function C53(props) @{
	<div class="c">
		53
		<C54 />
	</div>
}
function C52(props) @{
	<div class="c">
		52
		<C53 />
	</div>
}
function C51(props) @{
	const [v, set] = useState(0);
	_set51 = set;
	<div class="c">
		51:
		{v as number}

		<C52 />
	</div>
}
function C50(props) @{
	<div class="c">
		50
		<C51 />
	</div>
}
function C49(props) @{
	<div class="c">
		49
		<C50 />
	</div>
}
function C48(props) @{
	<div class="c">
		48
		<C49 />
	</div>
}
function C47(props) @{
	<div class="c">
		47
		<C48 />
	</div>
}
function C46(props) @{
	<div class="c">
		46
		<C47 />
	</div>
}
function C45(props) @{
	<div class="c">
		45
		<C46 />
	</div>
}
function C44(props) @{
	<div class="c">
		44
		<C45 />
	</div>
}
function C43(props) @{
	<div class="c">
		43
		<C44 />
	</div>
}
function C42(props) @{
	<div class="c">
		42
		<C43 />
	</div>
}
function C41(props) @{
	const [v, set] = useState(0);
	_set41 = set;
	<div class="c">
		41:
		{v as number}

		<C42 />
	</div>
}
function C40(props) @{
	<div class="c">
		40
		<C41 />
	</div>
}
function C39(props) @{
	<div class="c">
		39
		<C40 />
	</div>
}
function C38(props) @{
	<div class="c">
		38
		<C39 />
	</div>
}
function C37(props) @{
	<div class="c">
		37
		<C38 />
	</div>
}
function C36(props) @{
	<div class="c">
		36
		<C37 />
	</div>
}
function C35(props) @{
	<div class="c">
		35
		<C36 />
	</div>
}
function C34(props) @{
	<div class="c">
		34
		<C35 />
	</div>
}
function C33(props) @{
	<div class="c">
		33
		<C34 />
	</div>
}
function C32(props) @{
	<div class="c">
		32
		<C33 />
	</div>
}
function C31(props) @{
	const [v, set] = useState(0);
	_set31 = set;
	<div class="c">
		31:
		{v as number}

		<C32 />
	</div>
}
function C30(props) @{
	<div class="c">
		30
		<C31 />
	</div>
}
function C29(props) @{
	<div class="c">
		29
		<C30 />
	</div>
}
function C28(props) @{
	<div class="c">
		28
		<C29 />
	</div>
}
function C27(props) @{
	<div class="c">
		27
		<C28 />
	</div>
}
function C26(props) @{
	<div class="c">
		26
		<C27 />
	</div>
}
function C25(props) @{
	<div class="c">
		25
		<C26 />
	</div>
}
function C24(props) @{
	<div class="c">
		24
		<C25 />
	</div>
}
function C23(props) @{
	<div class="c">
		23
		<C24 />
	</div>
}
function C22(props) @{
	<div class="c">
		22
		<C23 />
	</div>
}
function C21(props) @{
	const [v, set] = useState(0);
	_set21 = set;
	<div class="c">
		21:
		{v as number}

		<C22 />
	</div>
}
function C20(props) @{
	<div class="c">
		20
		<C21 />
	</div>
}
function C19(props) @{
	<div class="c">
		19
		<C20 />
	</div>
}
function C18(props) @{
	<div class="c">
		18
		<C19 />
	</div>
}
function C17(props) @{
	<div class="c">
		17
		<C18 />
	</div>
}
function C16(props) @{
	<div class="c">
		16
		<C17 />
	</div>
}
function C15(props) @{
	<div class="c">
		15
		<C16 />
	</div>
}
function C14(props) @{
	<div class="c">
		14
		<C15 />
	</div>
}
function C13(props) @{
	<div class="c">
		13
		<C14 />
	</div>
}
function C12(props) @{
	<div class="c">
		12
		<C13 />
	</div>
}
function C11(props) @{
	const [v, set] = useState(0);
	_set11 = set;
	<div class="c">
		11:
		{v as number}

		<C12 />
	</div>
}
function C10(props) @{
	<div class="c">
		10
		<C11 />
	</div>
}
function C9(props) @{
	<div class="c">
		9
		<C10 />
	</div>
}
function C8(props) @{
	<div class="c">
		8
		<C9 />
	</div>
}
function C7(props) @{
	<div class="c">
		7
		<C8 />
	</div>
}
function C6(props) @{
	<div class="c">
		6
		<C7 />
	</div>
}
function C5(props) @{
	<div class="c">
		5
		<C6 />
	</div>
}
function C4(props) @{
	<div class="c">
		4
		<C5 />
	</div>
}
function C3(props) @{
	<div class="c">
		3
		<C4 />
	</div>
}
function C2(props) @{
	<div class="c">
		2
		<C3 />
	</div>
}
function C1(props) @{
	const [v, set] = useState(0);
	_set1 = set;
	<div class="c">
		1:
		{v as number}

		<C2 />
	</div>
}

export default function App(props) @{
	<C1 />
}

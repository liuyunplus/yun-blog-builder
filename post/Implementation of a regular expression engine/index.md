#### 1. Foreword

In the computer field, regular expressions are a veritable artifact, and its birth can be said to have directly promoted the development of computer software. So far it has been widely used in compilers, search engines, text processing and other fields, and is still exploring many unknown possibilities. For ordinary users, proficiency in regular expressions can effectively improve our work efficiency and improve our quality of life. However, in the face of regular grammar like a book of heaven, many people are discouraged from it. This article will start from the principle of regular expressions, so that readers can have an intuitive impression of the syntax of regular expressions. Later, we will build a regular engine by ourselves to deepen our understanding of regular expressions.

#### 2. What is language?

The language we usually speak is composed of sentences, each of which is a combination of characters. For English, these characters are taken from the alphabet, and for Chinese, these characters are taken from the Chinese character table. Whether it is the alphabet or the Chinese character list, they are limited character sets, and based on these character sets, various language worlds are formed. We can further abstract and generalize that a language is an arbitrary and countable set of strings on a given alphabet, where the given alphabet is a finite set of symbols, and the strings are the symbols in the alphabet a finite sequence. For example, a computer instruction is a finite sequence of binary alphabets such as {0, 1}, and a computer language is a collection of these computer instructions. Based on this abstraction, we can do some algebraic operations on the language. Before that, let's take a look at string operations.

Assuming that both x and y are strings, the concatenation operation of x and y is the string formed by appending y to x. For example, if x = "dog" and y = "house", then xy = "doghouse". Assuming $\epsilon$ is the empty string, then for any string $s$, $s{\epsilon} = {\epsilon}{s}=s$. If the connection of two strings is regarded as the "product" of these two strings, we can define the "exponential" operation of the strings as follows: define $s^0$ as $\epsilon$, and for $i\gt0$, $s^i$ is $s^{i-1}s$. Because $\epsilon{s}=s$, it follows that $s^1=s$, $s^2=ss$, $s^3=sss$, and so on.

In addition to common set operations, there are concatenation operations and closure operations in language computation. Language concatenation is the process of selecting a string from the first language, selecting another string from the second language, and then obtaining the collection of all strings by concatenating them. Language closure operations include the Kleene closure and the positive closure. The Kleene closure of a language L is denoted as L*, which represents the set of strings obtained by concatenating L zero or more times. The positive closure of L is denoted as L+, which represents the set of strings obtained by concatenating L one or more times. The table below presents the formal definitions of these operations.

| Operation | Definition |
| ------------- | ---------- |
| Union of L and M | $L\cup M= \lbrace s\mid s \text{ belongs to } L \text{ or } s \text{ belongs to } M \rbrace $ |
| Concatenation of L and M | $ LM = \lbrace st\mid s \text{ belongs to } L \text{ and } t \text{ belongs to } M \rbrace $ |
| Kleene Closure of L | $ L^* = \cup_{i=0}^{\infty} L^i $ |
| Positive Closure of L | $ L^+ = \cup_{i=1}^{\infty} L^i $ |

Let L represent the set of letters {A, B, ..., Z, a, b, c, ..., z}, and let D represent the set of numbers {0, 1, ..., 9}. Using the operations described above, we can construct new languages.

- $L\cup{D}$ is the set of strings of length 1, where each string is either a letter or a number.
- $LD$ is the set of strings of length 2, where each string consists of a letter followed by a number.
- $L^4$ is the set of strings composed of 4 letters.
- $L^*$ is the set of strings composed of letters, including the empty string $\epsilon$.
- $L(L\cup{D})^*$ is the set of strings that start with a letter and are composed of letters and numbers.
- $D^+$ is the set of strings composed of one or more numbers.

#### 3. Introduction to Regular Expressions

In order to better describe the language, people express the language by using regular expressions, and a regular expression represents a type of language. From the above description, we know that we can perform algebraic operations on the language to construct another language. In the same way, algebraic operations can be performed on smaller regular expressions to obtain a larger regular expression. For example, assuming that r and s are both regular expressions representing languages L(r) and L(s) respectively, by performing simple union, oncatenation and closure operations on them, we can construct a richer regular expression.

- $(r)\mid(s)$ is a regular expression that represents the language $L(r)\cup{L(s)}$.
- $(r)(s)$ is a regular expression that represents the language $L(r)L(s)$.
- $(r)^*$ is a regular expression that represents the language $(L(r))^*$.
- $(r)$ is a regular expression that represents the language $L(r)$.

In the same way, we can set some priorities for these operators to save some unnecessary parentheses when writing. The complete symbol priority list is as follows, where the red ones are the basic operators we have learned. Those not marked in red are some expansion operators, which exist mainly to enhance the expressive ability of regular expressions, and we will learn their meanings later.

| Precedence | Symbol                 |
| ------ | -------------------------- |
| Highest | \                                     |
| High | $\color{red}{()}$、(?:)、(?=)、[]      |
| Medium | $\color{red}*$、+、？、{n}、{n,}、{n,m} |
| Low  | ^、\$、General characters       |
| Second Lowest | <font color="red">Concatenation</font> |
| Lowest | $\color{red}\mid $                    |

By using the convention of operator precedence, we can rewrite the expression (a)|((b)\*(c)) as a|b\*c. Both of these expressions describe the same set of strings, but the latter appears to be much more concise. Like other mathematical operators, regular expressions also follow certain algebraic laws. Through these laws, we can understand that different forms of regular expressions can be equivalent, and therefore, they describe the same language. The table below lists the algebraic laws that hold true for any regular expressions r, s, and t.

| Law                       | Description           |
| ----------------------------- | ------------------------- |
| $r\mid s=s\mid r$             | $\mid$ is commutative |
| $r\mid(s\mid t)=(r\mid s)t$   | $\mid$ is associative |
| $r(st)=(rs)t$                 | Concatenation is associative |
| $r(s\mid t)=rs\mid rt;(s\mid t)r=sr\mid tr$ | Concatenation distributes over $\mid$ |
| $\epsilon{r}=r\epsilon=r$     | $\epsilon$ is the identity element for concatenation |
| $r^*=(r\mid\epsilon)^*$       | Closure always includes $\epsilon$ |
| $r^{\{**\}}=r^{\{*\}}$  | * is idempotent |

#### 4. Extensions to regular expressions

We can construct many expressive regular expressions by performing basic operations such as union, concatenation, and closure on subexpressions, but it is still far from enough to meet some special requirements. Therefore, many regular engines add some expansion operators to basic regular expressions, which are used to enhance the ability of regular expressions to describe string patterns, as follows:

| Expression | Description                    | Example | Matches       |
| ------ | ---------------------------------- | --------- | --------------------- |
| .      | Matches any character except a newline | a.c       | abc, asg, a2c |
| ^      | Matches the start of a line | ^abc      | abc，abcdef，abc123   |
| $      | Matches the end of a line | abc$      | myabc，123abc，theabc |
| ?      | Matches the preceding character 0 or 1 | ab?c      | ac，abc               |
| {n\}​   | Matches the preceding character exactly n times | (abc){2}  | abcabc                |
| {n,}​   | Matches the preceding character n or more times | (abc){2,} | abcabc, abcabcabc     |
| {n,m}​  | Matches the preceding character between n and m times | (a){2,4}  | aa, aaa, aaaaa        |
| [...]​  | Matches any character within the brackets | [abc]     | a，b，c               |
| [^...] | Matches any character not in the brackets | [^abc]    | xyz, 123, 1de         |
| [a-z]  | Matches any character between a and z | [b-z]     | bc, mind, xyz         |

In addition to the above expansion operators, most regular implementations also provide some common character set shorthands, which can make regular expressions more concise. Some common shorthands are listed below:

| Symbol | Description                                                  |
| ------ | ------------------------------------------------------------ |
| \d     | Matches a digit, equivalent to [0-9]                         |
| \D     | Matches a non-digit, equivalent to \[^\d]                    |
| \s     | Matches any whitespace character, equivalent to [\t\n\f\r\p{Z}] |
| \S     | Matches any non-whitespace character, equivalent to \[^\s]   |
| \w     | Matches any alphanumeric character, equivalent to [a-zA-Z0-9_] |
| \W     | Matches any non-alphanumeric character, including symbols, equivalent to \[^\w] |
| \f     | Matches a form feed character                                |
| \n     | Matches a newline character                                  |
| \r     | Matches a carriage return character                          |
| \t     | Matches a tab character                                      |
| \v     | Matches a vertical tab character                             |
| \p     | Matches a CR/LF (carriage return/line feed), used to match DOS line terminators |

#### 5. Finite automata

Regular expression is a highly generalized expression method, which can describe a huge collection of strings with concise syntax, and its function is to simplify people's coding work. In computers, finite automata are used to describe formal languages, which are event-driven state transition diagrams and have the same expressive power as regular expressions. A finite automaton is an abstract mathematical model that can change its state according to external input, so as to achieve the purpose of simulating and controlling the execution flow. A finite automaton consists of five parts, which can be represented by a five-tuple $(S, \Sigma, s, F, \delta)$, where the meanings of each part are as follows:

- $S$：Finite set of states.
- $\Sigma$：Set of input symbols.
- $s$：Initial state.
- $F$：Collection of accepting states.
- $\delta$：Collection of transition functions between states.

For example, suppose it is necessary to identify whether an English string contains the "main" substring, and a program can be used to simulate such a finite automaton.

![](./image/regular-0.svg)

The above figure is a very simple finite automaton model, which starts from the initial state 0 and continuously reads in the next character and performs state transitions. If the final automaton can reach the acceptance state 4, it indicates that the input string contains "main" substring, otherwise it indicates that the substring is not included. Such an automaton is also composed of five parts, the specific meaning of each part is as follows:

- $S$ ：Finite state set $\lbrace 0，1，2，3，4 \rbrace$
- $\Sigma$ ：Alphabet $\lbrace a，b，c，\dots，z，A，B，C，\dots，Z \rbrace$
- $s$ ：Initial state $0$
- $F$：Accept state set $\lbrace 4 \rbrace$
- $\delta$ ：Collection of state transition functions $\lbrace (0，m)\to 1，(1，a)\to 2，(2，i)\to 3，(3，n)\to 4 \rbrace$

According to the nature of state transition, finite automata (FA) are divided into uncertain finite automata (NFA) and deterministic finite automata (DFA). NFA allows state transition for empty string input $\epsilon$, and Transitions to multiple goal states are allowed for the same input character. DFA has restrictions on these, does not allow state transitions based on empty strings, and can only transition to one target state for the same input character. NFA and DFA are equivalent in expressive power, any DFA is a special case of an NFA, and any NFA can be simulated by a DFA. For example, the NFA and DFA below describe the same language.

(1) An NFA that can recognize the pattern $a(b|c)^*$ is shown in the figure below.

![](./image/regular-1.svg)

(2) A DFA that recognizes the pattern $a(b|c)^*$ is shown in the figure below.

![](./image/regular-2.svg)

As can be seen from the above two figures, the state transition of NFA is uncertain and the state transition of DFA is deterministic. For machines, uncertainty will generate a lot of backtracking, which leads to the execution performance of NFA is not as good as that of DFA. On the other hand, directly constructing NFA based on regular expressions is simpler and requires less time than directly constructing DFA, so in practical applications, it is necessary to use NFA or DFA in combination with scenarios. Generally speaking, for complex regular expressions that need to be reused many times, it will be better to directly compile them into DFA to simulate the effect; and for simple regular expressions that are only used a few times, it will be better to use NFA to simulate the effect good. A summary of the specific differences between the two is shown in the table below.

| Description                                           | NFA      | DFA     |
| ----------------------------------------------------- | -------- | ------- |
| Allow transitions based on empty string $\epsilon$    | Yes      | No      |
| Number of target states for a single input transition | Multiple | One     |
| Complexity based on regular expression construction   | Simple   | Complex |
| Time required for initial construction                | Less     | More    |
| Time required for string recognition                  | More     | Less    |

#### 6. Thompson algorithm

We discussed above that complex regular expressions can be constructed from simple regular expressions through basic operations such as union, concatenation, and closure. The Thompson algorithm uses this inductive idea to convert a regular expression into an equivalent NFA Yes, the algorithm recursively divides a regular expression into its sub-expressions, and after obtaining the NFA corresponding to each sub-expression, constructs the expression itself according to the operational relationship between the sub-expressions and a series of rules The corresponding NFA. The operation rules for constructing its own NFA through subexpression NFA are described below.

##### 6.1 Minimal NFA Construction

Assuming $r_1=\epsilon$ and $r_2=a$, the NFA representing $r_1$ is shown on the left side of the following diagram, while the NFA representing $r_2$ is shown on the right side. Here, the empty string $\epsilon$ and the single character $a$ are both minimal regular expressions, so there is no need for further recursion. The rules for constructing an NFA using them are as follows: create a new start state i and an accept state f, and connect these two states directly. The label can be either the empty string $\epsilon$ or a single character. The resulting NFA has only one state transition.

![](./image/thompson-0.svg)

##### 6.2 Union operation

Assuming r=s|t, the NFA of r, denoted as N(r), can be constructed as shown in the following diagram. Here, i and f are new states representing the start state and accept state of N(r), respectively. There is an $\epsilon$ transition from i to the start states of both N(s) and N(t), and there is also an $\epsilon$ transition from the accept states of N(s) and N(t) to f. Please note that the accept states of N(s) and N(t) are not accept states in N(r). This is because any path from i to f in N(r) either goes through N(s) or goes through N(t), and the $\epsilon$ transitions entering or leaving i and f do not change the labels along the path. Therefore, we can conclude that the set of strings recognized by N(r) is L(s) $\cup$ L(t).

![](./image/thompson-1.svg)

##### 6.3 Concatenation operation

Assuming r=st, the NFA of r, denoted as N(r), can be constructed as shown in the following diagram. The start state of N(s) becomes the start state of N(r). The accept state of N(t) becomes the only accept state of N(r). The accept state of N(s) and the start state of N(t) are merged into a single state, which retains all the transitions from the original states entering and leaving the merged state. A path from i to f must first pass through N(s), so the labels along this path start with a string from L(s). Then, the path continues through N(t), so the labels along this path end with a string from L(t). Therefore, the strings recognized by N(r) are precisely L(s)L(t).

![](./image/thompson-2.svg)

##### 6.4 Closure operation

Assuming $r=s^*$, the NFA of r, denoted as N(r), can be constructed as shown in the following diagram. Here, i and f are two new states representing the start state and accept state of N(r), respectively. To reach f from i, we can proceed along the newly introduced $\epsilon$-labeled path, which corresponds to a string in $L(s)^0$. We can also reach the start state of N(s) and then traverse through that NFA, returning zero or more times from its accept state to its start state and repeating the process. These options allow N(r) to accept all strings in the sets $L(s)^1$, $L(s)^2$, and so on. Therefore, the set of all strings recognized by N(r) is precisely $L(s)^*$.

![](./image/thompson-3.svg)

#### 7. Subset construction

Due to the uncertainty of the state transition of NFA, this is mainly because it supports transitions based on empty strings, and one input character can go to multiple target states. This will cause the computer to generate a lot of backtracking during execution, seriously affecting execution performance. However, since constructing NFA from regular expressions is simpler than directly constructing DFA, NFA is suitable for scenarios where regular expressions are simple and only used once or twice, such as the grep command in linux. For scenarios where you want to reuse the same regular expression multiple times, it is still more reliable to convert it into DFA. The subset construction algorithm described below is the algorithm used to convert an NFA into an equivalent DFA.

##### 7.1 Algorithm principle

The steps of the subset construction method are as follows:

1. Firstly, based on the initial state of NFA, find all the state sets that can be transformed by $\epsilon$ through it, mark this set as $q_0$, and add it to the set Q, at this time Q = { $q_0$ }.

2. Extract the set of states q from the set Q, iterate over each input character c and do the following:

   2.1 Calculate the state transition of each state in the state set q under the character c, and collect the migrated states as a new set.

   2.2 Perform epsilon transformation on the states in the new set to generate a brand new state set and add it to Q.

3. Continue to perform the following operations until we can no longer add new elements to the collection Q, and then exit the loop operation.

4. Map each state set in Q to a DFA state, mark the set containing the initial state of NFA as the initial state of DFA, mark the set containing the end state of NFA as the end state of DFA, and map the transition relationship of elements in Q It is a DFA state transition relationship.


The following is expressed in pseudocode:

```
q0 = ε-closure(s0);
Q = {q0};
T = [[]]
while Q is not empty do:
	get q from Q and remove it;
	for each input charcter c:
		t = ε-closure(move(q, c));
		T[q, c] = t;
		if t not in Q then:
			append t to Q;
	end;
end;
```

The three operation definitions involved in the above code are as follows:

![](./image/construction-1.svg)

##### 7.2 Algorithm example

Taking the regular expression $(a|b)^{*}abb$ as an example, its NFA is shown in the figure below.

![](./image/construction-0.svg)

Step 0: Since the initial state of NFA is 0, the initial state set is $\epsilon$-closure(0) = {0, 1, 2, 4, 7}, mark this set as A, and add it to set Q, where Q = {A}.

Step 1: Take the set A from Q, and find the state set when inputting symbols a and b respectively:

$\epsilon$-closure(move(A, a)) = {1, 2, 3, 4, 6, 7, 8}, mark this set as B and add it to Q, where Q = { B }.

$\epsilon$-closure(move(A, b)) = {1, 2, 4, 5, 6, 7}, mark this set as C and add it to Q, where Q = {B, C}.

Step 2: Take the set B from Q, and find the state set when inputting symbols a and b respectively:

$\epsilon$-closure(move(B, a)) = {1, 2, 3, 4, 6, 7, 8}, this set is B, which is not added to Q this time, so Q = { C }.

$\epsilon$-closure(move(B, b)) = {1, 2, 4, 5, 6, 7, 9}, mark this set as D and add it to Q, where Q = {C, D}.

Step 3: Take the set C from Q, and find the state set when inputting symbols a and b respectively:

$\epsilon$-closure(move(C, a)) = {1, 2, 3, 4, 6, 7, 8}, this set is B, which is not added to Q this time, so Q = { D }.

$\epsilon$-closure(move(C, b)) = {1, 2, 4, 5, 6, 7}, this set is C, which is not added to Q this time, so Q = { D }.

Step 4: Take the set D from Q, and find the state set when inputting symbols a and b respectively:

$\epsilon$-closure(move(D, a)) = {1, 2, 3, 4, 6, 7, 8}, this set is B, which is not added to Q this time, so Q = {}.

$\epsilon$-closure(move(D, b)) = {1, 2, 4, 5, 6, 7, 10}, mark this set as E and add it to Q, where Q = { E }.

Step 5: Take the set E from Q, and find the state set when inputting symbols a and b respectively:

$\epsilon$-closure(move(E, a)) = {1, 2, 3, 4, 6, 7, 8}, this set is B, which is not added to Q this time, so Q = {}.

$\epsilon$-closure(move(E, b)) = {1, 2, 4, 5, 6, 7}, this set is C, which is not added to Q this time, so Q = {}.

Step 6: Since there is no new state to be added in the set Q, the loop ends, and the new state transition table is as follows:

![](./image/construction-2.svg)

Step 7: The DFA generated by the above state transition table is as follows:

![](./image/construction-3.svg)

#### 8. Hopcroft algorithm

After using the subset construction method to convert NFA to DFA, there are usually many redundant states, which makes DFA not compact enough. To improve the efficiency of computer simulation execution, Hopcroft's algorithm can be used to minimize the state of DFA. The working principle of this algorithm will be described below.

##### 8.1 Algorithm principle

The main idea of Hopcroft's algorithm is based on the concept of equivalence classes. Its core idea is that if two states have the same behavior when receiving any input character, then they are equivalent and can be merged into an equivalence class. The following is the overall process description of the algorithm:

1. First, partition states initially into accepting states and non-accepting states.

2. Repeatedly refine partitions:

   2.1 If partition p contains states that transition to different successor partitions on symbol s.

   2.2 Split p into new sub-partitions where all states in each sub-partition transition to the same successor partition on s.

3. Repeat the refinement until reaching the fixpoint (no further refinements possible).
4. Finally, a new minimized DFA is created by merging states belonging to the same equivalence class into one state.

The following is expressed in pseudocode:

```
T = {AcceptStates, NonAcceptStates};
P = {};
while (P != T) do:
	P = T;
	T = P;
	for each set S in P do:
		T = T ∪ Split(S);
	end;
end;
	
Split(S):
	for each input charcter c:
		if c splits S into s1 and s2:
			return {s1, s2};
	end;
	return S
```

##### 8.2 Algorithm example

Consider the DFA below as an example on the left, with the state transition table shown on the right.

![](./image/hopcroft-0.svg)

Step 0：First, divide the states into non-acceptance states {A, B, C, D} and the acceptance state {E}, denoted as S0 and S1, respectively.

![](./image/hopcroft-1.svg)

Step 1：Since S1 contains only one state, further partitioning is not possible. We proceed to partition the set S0.

![](./image/hopcroft-2.svg)

Step 2: Based on the diagram, we observe that states A, B, and C all transition to S0 for inputs 0 and 1, while state D transitions to S1 only for input 1. We partition {A, B, C, D} into {A, B, C} and {D}, forming the equivalence class set P1.

![](./image/hopcroft-3.svg)

Step 3: According to the diagram, states A and C both transition to S0 for inputs 0 and 1, while state B transitions to S1 only for input 1. We partition {A, B, C} into {A, C} and {B}, resulting in the equivalence class set P2.

![](./image/hopcroft-4.svg)

Step 4: By examining the diagram, we find that states A and C have identical successor states for inputs 0 and 1. Thus, we no longer partition the set {A, C}. At this point, all equivalence classes cannot be further divided. The final equivalence class set is P3 = {{A, C}, {B}, {D}, {E}}.

![](./image/hopcroft-5.svg)

Step 5: Finally, we merge the states within each equivalence class to obtain the corresponding minimized DFA as shown.

![](./image/hopcroft-6.svg)

#### 9. Summarize

This article introduces the basic concepts of regular expressions and how to construct complex regular expressions through basic operations such as union, concatenation and closure. We also detail the conversion of regular expressions into NFA form using Thompson's algorithm. However, due to non-determinism in NFA, such as null transitions, etc., it may cause backtracking problems. Therefore, we use the subset construction algorithm to convert NFA to DFA, and use the Hopcroft algorithm to minimize the number of states of DFA to improve the operating efficiency of the state machine. The application of these algorithms allows us to build an efficient and simple regular expression engine. By deeply understanding the basic principles of regular expressions, we will be able to be more flexible in the use of regular expressions in the future.

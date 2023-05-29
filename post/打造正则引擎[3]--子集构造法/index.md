#### 1. 前言

在上一篇文章中我们讲到过，NFA的状态转换存在不确定性，主要是由于它支持基于空串的转换，还有就是一个输入字符可以转到多个目标状态。这就会导致计算机在执行时会产生大量回溯，严重影响执行性能。但是由于从正则表达式构造NFA比直接构造DFA更加简单，所以NFA适合于正则表达式简单，并且只使用一两次的场景，例如linux中的grep命令。对于想要多次复用同一正则表达式的场景，还是需要将其转换成DFA更加靠谱。本文介绍的子集构造算法就是用于将NFA转换成等价的DFA的算法。而将正则表达式转换成NFA还是用上篇介绍的Thompson算法。

#### 2. 算法原理

我们还是以正则表达式 $a(b|c)*$ 作为贯穿本文的例子，在上一篇文章中我们已经将它转换成了NFA的形式，它的样子如图1-1所示。接下来要做的是将对应的NFA转换成DFA，如果我们转换正确，那么最终生成的DFA的样子应该是如图1-2所示。

![1](./image/WmOlNR.png)

![2](./image/CRJ1pu.png)

子集构造法的步骤如下：

1. 首先基于NFA的初始状态，求所有能够通过它进行 $\epsilon$ 转换得到的状态集合(此操作称为 $\epsilon$ 闭包操作)，并将该集合标记为 $q_0$，将 $q_0$ 添加到集合 $Q$ 中，此时 $Q=\lbrace\lbrace0\rbrace\rbrace$。
2. 对NFA的输入字符进行遍历，假设其中输入字符为 $a$，求集合 $q_0$ 通过 $a$ 能转换到的状态集合，并对该集合的所有元素求 $\epsilon$ 闭包，得到状态集合 $q_1$，将 $q_1$ 添加至 $Q$ 中，此时 $Q=\lbrace\lbrace0\rbrace,\lbrace1,2,3,5,8\rbrace\rbrace$。
3. 不断重复步骤二的操作，直到我们再也不能向集合 $Q$ 中添加新的元素，此时退出循环操作。
4. 将集合 $Q$ 中的每个元素映射为DFA的一个状态，其中包含NFA初始状态的集合标记为DFA的初始状态，包含NFA结束状态的集合标记为DFA的结束状态。集合 $Q$ 中元素的转移关系映射为DFA的转移函数。

下图显示了整个步骤的伪代码和各次迭代的过程：

![3](./image/Mv9ADa.png)

假设NFA有N个不同的状态，那么$Q$至多可以有$2^N$个不同的元素，因此理论上while循环在最坏的情况下可能会循环$2^N$次。幸运的是，在实践中这种情况几乎很少出现，反而是循环会很快的到达不动点然后停止。

#### 3. 代码实现

SubsetConstruction.java的实现
```java
package com.liuyun.github.test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

public class SubsetConstruction {

    public static DFA compile(NFA nfa) {
        List<Set<Integer>> stateList = new ArrayList();
        List<Map<String, Object>> tranList = new ArrayList();
        List<Set<Integer>> finalStateList = new ArrayList();

        Queue<Set<Integer>> workQueue = new LinkedList();
        Set<Character> symbolSet = nfa.getSymbolSet();

        //获得NFA初始状态的epsilon闭包
        Set<Integer> firstStates = nfa.epsilonClosures(nfa.getStartStates());
        stateList.add(firstStates);
        workQueue.add(firstStates);

        while (!workQueue.isEmpty()) {
            Set<Integer> sourceStates = workQueue.poll();
            //若集合包含NFA的接受状态，则将此集合作为DFA的接受状态
            if(sourceStates.contains(nfa.finalState)) {
                finalStateList.add(sourceStates);
            }
            //遍历NFA上的所有标号字符
            for (char symbol : symbolSet) {
                Set<Integer> targetStates = nfa.epsilonClosures(nfa.delta(sourceStates, symbol));
                if(targetStates == null || targetStates.size() == 0) {
                    continue;
                }
                Map<String, Object> map = new HashMap();
                map.put(Constants.FROM, sourceStates);
                map.put(Constants.TO, targetStates);
                map.put(Constants.SYMBOL, symbol);
                tranList.add(map);
                //若当前状态集合未包含在之前的集合里面
                if(!isContain(stateList, targetStates)) {
                    stateList.add(targetStates);
                    workQueue.add(targetStates);
                }
            }
        }

        return generate(stateList, tranList, finalStateList);
    }

    private static DFA generate(List<Set<Integer>> stateList, List<Map<String, Object>> tranList,
                                List<Set<Integer>> finalStateList) {
        List<Integer> states = new ArrayList();
        List<Transition> transitions = new ArrayList();
        Set<Integer> finalStates = new HashSet();

        Map<Set<Integer>, Integer> stateMap = new HashMap();
        //设置所有状态集合
        for (int i = 0; i < stateList.size(); i++) {
            states.add(i);
            stateMap.put(stateList.get(i), i);
        }
        //设置转换函数
        for (Map<String, Object> map : tranList) {
            Set<Integer> from = (HashSet) map.get(Constants.FROM);
            Set<Integer> to = (HashSet) map.get(Constants.TO);
            char symbol = (char) map.get(Constants.SYMBOL);
            Transition transition = new Transition(stateMap.get(from), stateMap.get(to), symbol);
            transitions.add(transition);
        }
        //设置接受状态集合
        for (Set<Integer> stateSet : finalStateList) {
            finalStates.add(stateMap.get(stateSet));
        }
        return new DFA(states, transitions, finalStates);
    }

    private static boolean isContain(List<Set<Integer>> totalList, Set<Integer> set) {
        for (Set<Integer> item : totalList) {
            if(item.containsAll(set)) {
                return true;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        NFA nfa = Thompson.compile("a(b|c)*");
        DFA dfa = SubsetConstruction.compile(nfa);
        dfa.display();
    }

}

```

NFA.java的实现
```java
package com.liuyun.github.test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;

public class NFA {

    /** 初始状态 */
    public int startState;
    /** 状态集合 */
    public List<Integer> states;
    /** 状态转移函数集合 */
    public List<Transition> transitions;
    /** 最终状态 */
    public int finalState;

    public NFA(){
        this.startState = 0;
        this.states = new ArrayList();
        this.transitions = new ArrayList();
        this.finalState = 0;
    }

    public NFA(int size){
        this.startState = 0;
        this.states = new ArrayList();
        this.transitions = new ArrayList();
        this.finalState = 0;
        this.setStateSize(size);
    }

    public NFA(char c){
        this.startState = 0;
        this.states = new ArrayList();
        this.transitions = new ArrayList();
        this.setStateSize(2);
        this.finalState = 1;
        this.transitions.add(new Transition(0, 1, c));
    }

    public void setStateSize(int size){
        for (int i = 0; i < size; i++) {
            this.states.add(i);
        }
    }

    public Set<Integer> getStartStates() {
        HashSet hashSet = new HashSet();
        hashSet.add(this.states.get(0));
        return hashSet;
    }

    public Set<Character> getSymbolSet() {
        Set<Character> charSet = new HashSet();
        for (Transition transition : transitions) {
            if(Constants.EPSILON != transition.getSymbol()) {
                charSet.add(transition.getSymbol());
            }
        }
        return charSet;
    }

    public Set<Integer> delta(Set<Integer> stateSet, char symbol) {
        Set<Integer> resultSet = new HashSet();
        for (Transition transition : transitions) {
            if(stateSet.contains(transition.getFrom()) && transition.getSymbol() == symbol) {
                resultSet.add(transition.getTo());
            }
        }
        return resultSet;
    }

    public Set<Integer> epsilonClosures(Set<Integer> stateSet) {
        Set<Integer> resultSet = new HashSet();
        Queue<Integer> queue = new LinkedList();
        queue.addAll(stateSet);

        while (!queue.isEmpty()) {
            Integer state = queue.poll();
            resultSet.add(state);
            for (Transition transition : transitions) {
                if(transition.getFrom() == state && transition.getSymbol() == Constants.EPSILON
                        && !resultSet.contains(transition.getTo())) {
                    queue.add(transition.getTo());
                }
            }
        }

        return resultSet;
    }

    public void display(){
        for (Transition t: transitions){
            System.out.println("("+ t.from +", "+ t.symbol + ", "+ t.to +")");
        }
    }

}

```

DFA.java的实现
```java
package com.liuyun.github.test;

import java.util.List;
import java.util.Set;

public class DFA {

    /** 初始状态 */
    public int startState;
    /** 状态集合 */
    public List<Integer> states;
    /** 状态转移函数集合 */
    public List<Transition> transitions;
    /** 接受状态集合 */
    public Set<Integer> finalStates;

    public DFA(List<Integer> states, List <Transition> transitions, Set<Integer> finalStates) {
        this.startState = states.get(0);
        this.states = states;
        this.transitions = transitions;
        this.finalStates = finalStates;
    }

    public void display(){
        for (Transition t: transitions){
            System.out.println("("+ t.from +", "+ t.symbol + ", "+ t.to +")");
        }
    }

}

```
在main方法中使用正则表达式 $a(b|c)^*$ 来构造NFA，再通过NFA来构造DFA，最终打印的DFA结果如下所示。将结果绘制成带标号边的状态转移图即可得到图1-2所示的DFA。
```shell
(0, a, 1)
(1, b, 2)
(1, c, 3)
(2, b, 2)
(2, c, 3)
(3, b, 2)
(3, c, 3)
```

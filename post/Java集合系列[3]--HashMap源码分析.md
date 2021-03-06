---
title: 'Java集合系列[3]--HashMap 源码分析'
date: 2018-02-28
categories: Java基础
cover: 18
abstract: '前面我们已经分析了ArrayList和LinkedList这两个集合，我们知道ArrayList是基于数组实现的，LinkedList是基于链表实现的。它们各自有自己的优劣势，例如ArrayList在定位查找'
---
前面我们已经分析了 ArrayList 和 LinkedList 这两个集合，我们知道 ArrayList 是基于数组实现的，LinkedList 是基于链表实现的。它们各自有自己的优劣势，例如 ArrayList 在定位查找元素时会优于 LinkedList，而 LinkedList 在添加删除元素时会优于 ArrayList。而本篇介绍的 HashMap 综合了二者的优势，它的底层是基于哈希表实现的，如果不考虑哈希冲突的话，HashMap 在增删改查操作上的时间复杂度都能够达到惊人的 O(1)。我们先看看它所基于的哈希表的结构。
![](https://raw.githubusercontent.com/liuyunplus/yun-blog-builder/main/post/image/2160e90e540d11ec9b7cacde48001122.png)

从上图中可以看到，哈希表是由数组和链表共同构成的一种结构，当然上图是一个不好的示例，一个好的哈希函数应该要尽量平均元素在数组中的分布，减少哈希冲突从而减小链表的长度。链表的长度越长，意味着在查找时需要遍历的结点越多，哈希表的性能也就越差。接下来我们来看下 HashMap 的部分成员变量。

```java
//默认初始容量
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;

//默认最大容量
static final int MAXIMUM_CAPACITY = 1 << 30;

//默认加载因子, 指哈希表可以达到多满的尺度
static final float DEFAULT_LOAD_FACTOR = 0.75f;

//空的哈希表
static final Entry<?,?>[] EMPTY_TABLE = {};

//实际使用的哈希表
transient Entry<K,V>[] table = (Entry<K,V>[]) EMPTY_TABLE;

//HashMap大小, 即HashMap存储的键值对数量
transient int size;

//键值对的阈值, 用于判断是否需要扩增哈希表容量
int threshold;

//加载因子
final float loadFactor;

//修改次数, 用于fail-fast机制
transient int modCount;

//使用替代哈希的默认阀值
static final int ALTERNATIVE_HASHING_THRESHOLD_DEFAULT = Integer.MAX_VALUE;

//随机的哈希种子, 有助于减少哈希碰撞的次数
transient int hashSeed = 0;
```

由成员变量中看到，HashMap 默认的初始容量为 16，默认的加载因子是 0.75。而 threshold 是集合能够存储的键值对的阀值，默认是初始容量*加载因子，也就是 16*0.75=12，当键值对要超过阀值时，意味着这时候的哈希表已处于饱和状态，再继续添加元素就会增加哈希冲突，从而使 HashMap 的性能下降。这时会触发自动扩容机制，以保证 HashMap 的性能。我们还可以看到哈希表其实就是一个 Entry 数组，数组存放的每个 Entry 都是单向链表的头结点。这个 Entry 是 HashMap 的静态内部类，来看看 Entry 的成员变量。

```java
static class Entry<K,V> implements Map.Entry<K,V> {
    final K key;      //键
    V value;          //值
    Entry<K,V> next;  //下一个Entry的引用
    int hash;         //哈希码
  
    ...               //省略下面代码
}
```

一个 Entry 实例就是一个键值对，里面包含了 key 和 value，同时每个 Entry 实例还有一个指向下一个 Entry 实例的引用。为了避免重复计算，每个 Entry 实例还存放了对应的 Hash 码。可以说 Entry 数组就是 HashMap 的核心，所有的操作都是针对这个数组来完成的。由于 HashMap 源码比较长，不可能面面俱到的介绍它的所有方法，因此我们只抓住重点来进行介绍。接下来我们将以问题为导向，针对下面几个问题深入探究 HashMap 的内部机制。

1.HashMap 在构造时做了哪些操作？

```java
//构造器, 传入初始化容量和加载因子
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0) {
        throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
    }
    //如果初始化容量大于最大容量, 就把它设为最大容量
    if (initialCapacity > MAXIMUM_CAPACITY) {
        initialCapacity = MAXIMUM_CAPACITY;
    }
    //如果加载因子小于0或者加载因子不是浮点数, 则抛出异常
    if (loadFactor <= 0 || Float.isNaN(loadFactor)) {
        throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
    }
    //设置加载因子
    this.loadFactor = loadFactor;
    //阈值为初始化容量
    threshold = initialCapacity;
    init();
}

void init() {}
```

所有的构造器都会调用到这个构造器，在这个构造器中我们看到除了对参数做一些校验之外，它就做了两件事，设置加载因子为传入的加载因子，设置阀值为传入的初始化大小。而 init 方法是空的，啥也没做。注意，这时候并没有根据传入的初始化大小去新建一个 Entry 数组哦。那在什么时候再去新建数组呢？继续往下看。

2.HashMap 添加键值对时会进行什么操作？

```java
//放置key-value键值对到HashMap中
public V put(K key, V value) {
    //如果哈希表没有初始化就进行初始化
    if (table == EMPTY_TABLE) {
        //初始化哈希表
        inflateTable(threshold);
    }
    if (key == null) {
        return putForNullKey(value);
    }
    //计算key的hash码
    int hash = hash(key);
    //根据hash码定位在哈希表的位置
    int i = indexFor(hash, table.length);
    for (Entry<K,V> e = table[i]; e != null; e = e.next) {
        Object k;
        //如果对应的key已经存在, 就替换它的value值, 并返回原先的value值
        if (e.hash == hash && ((k = e.key) == key || key.equals(k))) {
            V oldValue = e.value;
            e.value = value;
            e.recordAccess(this);
            return oldValue;
        }
    }
    modCount++;
    //如果没有对应的key就添加Entry到HashMap中
    addEntry(hash, key, value, i);
    //添加成功返回null
    return null;
}
```

看到，在添加键值对时会先检查哈希表是否是个空表，如果是空表就进行初始化。之后再进行后续操作，调用哈希函数计算传入的 key 的 Hash 码。根据 hash 码定位到 Entry 数组的指定槽位，然后对该槽位的单向链表进行遍历，如果传入的已经存在了就进行替换操作，否则就新建一个 Entry 添加到哈希表中。

3.哈希表是怎样初始化的？

```java
//初始化哈希表, 会对哈希表容量进行膨胀, 因为有可能传入的容量不是2的幂
private void inflateTable(int toSize) {
    //哈希表容量必须是2的次幂
    int capacity = roundUpToPowerOf2(toSize);
    //设置阀值, 这里一般是取capacity*loadFactor
    threshold = (int) Math.min(capacity * loadFactor, MAXIMUM_CAPACITY + 1);
    //新建指定容量的哈希表
    table = new Entry[capacity];
    //初始化哈希种子
    initHashSeedAsNeeded(capacity);
}
```

上面我们知道，在构造 HashMap 时不会新建 Entry 数组，而是在 put 操作时检查当前哈希表是否是个空表，如果是空表就调用 inflateTable 方法进行初始化。上面贴出了这个方法的代码，可以看到方法内部会重新计算 Entry 数组的容量，因为在构造 HashMap 时传入的初始化大小可能不是 2 的幂，因此要将这个数转换成 2 的幂再去根据新的容量新建 Entry 数组。初始化哈希表时再次重新设置阀值，阀值一般是 capacity*loadFactor。此外，在初始化哈希表时还会去初始化哈希种子(hashSeed)，这个 hashSeed 用于优化哈希函数，默认为 0 是不使用替代哈希算法，但是也可以自己去设置 hashSeed 的值，以达到优化效果。具体下面会讲到。

4.HashMap 在什么时候判断是否要扩容，以及它是怎样扩容的？

```java
//添加Entry方法, 先判断是否要扩容
void addEntry(int hash, K key, V value, int bucketIndex) {
    //如果HashMap的大小大于阀值并且哈希表对应槽位的值不为空
    if ((size >= threshold) && (null != table[bucketIndex])) {
        //因为HashMap的大小大于阀值, 表明即将发生哈希冲突, 所以进行扩容
        resize(2 * table.length);
        hash = (null != key) ? hash(key) : 0;
        bucketIndex = indexFor(hash, table.length);
    }
    //在这里表明HashMap的大小没有超过阀值, 所以不需要扩容
    createEntry(hash, key, value, bucketIndex);
}

//对哈希表进行扩容
void resize(int newCapacity) {
    Entry[] oldTable = table;
    int oldCapacity = oldTable.length;
    //如果当前已经是最大容量就只能增大阀值了
    if (oldCapacity == MAXIMUM_CAPACITY) {
        threshold = Integer.MAX_VALUE;
        return;
    }
    //否则就进行扩容
    Entry[] newTable = new Entry[newCapacity];
    //迁移哈希表的方法
    transfer(newTable, initHashSeedAsNeeded(newCapacity));
    //将当前哈希表设置为新的哈希表
    table = newTable;
    //更新哈希表阈值
    threshold = (int)Math.min(newCapacity * loadFactor, MAXIMUM_CAPACITY + 1);
}
```

在调用 put 方法添加一个键值对时，如果集合中没有存在的 key 就去调用 addEntry 方法新建一个 Entry。看到上面贴出的 addEntry 代码，在新建一个 Entry 之前会先判断当前集合元素的大小是否超过了阀值，如果超过了阀值就调用 resize 进行扩容。传入的新的容量是原来哈希表的两倍，在 resize 方法内部会新建一个容量为原先的 2 倍的 Entry 数组。然后将旧的哈希表里面的元素全部迁移到新的哈希表，其中可能会进行再哈希，根据 initHashSeedAsNeeded 方法计算的值来确定是否进行再哈希。完成哈希表的迁移之后，将当前哈希表替换为新的，最后再根据新的哈希表容量来重新计算 HashMap 的阀值。

5.为什么 Entry 数组的大小必须为 2 的幂？

```java
//返回哈希码对应的数组下标
static int indexFor(int h, int length) {
    return h & (length-1);
}
```

indexFor 方法是根据 hash 码来计算出在数组中对应的下标。我们可以看到在这个方法内部使用了与(&)操作符。与操作是对两个操作数进行位运算，如果对应的两个位都为 1，结果才为 1，否则为 0。与操作经常会用于去除操作数的高位值，例如：01011010 & 00001111 = 00001010。我们继续回到代码中，看看 h&(length-1)做了些什么。
![](https://raw.githubusercontent.com/liuyunplus/yun-blog-builder/main/post/image/216120cc540d11ec9b7cacde48001122.png)

已知传入的 length 是 Entry 数组的长度，我们知道数组下标是从 0 开始计算的，所以数组的最大下标为 length-1。如果 length 为 2 的幂，那么 length-1 的二进制位后面都为 1。这时 h&(length-1)的作用就是去掉了 h 的高位值，只留下 h 的低位值来作为数组的下标。由此可以看到 Entry 数组的大小规定为 2 的幂就是为了能够使用这个算法来确定数组的下标。

6.哈希函数是怎样计算 Hash 码的？

```java
//生成hash码的函数
final int hash(Object k) {
    int h = hashSeed;
    //key是String类型的就使用另外的哈希算法
    if (0 != h && k instanceof String) {
        return sun.misc.Hashing.stringHash32((String) k);
    }
    h ^= k.hashCode();
    //扰动函数
    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

hash 方法的最后两行是真正计算 hash 值的算法，计算 hash 码的算法被称为扰动函数，所谓的扰动函数就是把所有东西杂糅到一起，可以看到这里使用了四个向右移位运算。目的就是将 h 的高位值与低位值混合一下，以此增加低位值的随机性。在上面我们知道定位数组的下标是根据 hash 码的低位值来确定的。key 的 hash 码是通过 hashCode 方法来生成的，而一个糟糕的 hashCode 方法生成的 hash 码的低位值可能会有很大的重复。为了使得 hash 码在数组上映射的比较均匀，扰动函数就派上用场了，把高位值的特性糅合进低位值，增加低位值的随机性，从而使散列分布的更加松散，以此提高性能。下图举了个例子帮助理解。
![](https://raw.githubusercontent.com/liuyunplus/yun-blog-builder/main/post/image/21615060540d11ec9b7cacde48001122.png)

7.替代哈希是怎么回事？
我们看到 hash 方法中首先会将 hashSeed 赋值给 h。这个 hashSeed 就是哈希种子，它是一个随机的值，作用就是帮助优化哈希函数。hashSeed 默认是 0，也就是默认不使用替代哈希算法。那么什么时候使用 hashSeed 呢？首先需要设置开启替代哈希，在系统属性中设置 jdk.map.althashing.threshold 的值，在系统属性中这个值默认是-1，当它是-1 的时候使用替代哈希的阀值为 Integer.MAX_VALUE。这也意味着可能你永远也不会使用替代哈希了。当然你可以把这个阀值设小一点，这样当集合元素达到阀值后就会生成一个随机的 hashSeed。以此增加 hash 函数的随机性。为什么要使用替代哈希呢？当集合元素达到你设定的阀值之后，意味着哈希表已经比较饱和了，出现哈希冲突的可能性就会大大增加，这时对再添加进来的元素使用更加随机的散列函数能够使后面添加进来的元素更加随机的分布在散列表中。

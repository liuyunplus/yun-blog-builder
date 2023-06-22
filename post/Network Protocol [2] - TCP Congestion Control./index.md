#### 背景

TCP协议是一种可靠的网络传输协议，为了保证数据传输的可靠性，发送方在检测到丢包的情况下会进行重传。这样就能够保证接收方收到的数据是完整的，整个过程是自动化的，一切看起来都是这么美好。但是，如果不进行任何控制，就会导致一个灾难性的后果。试想，一般出现了丢包的情况可能就意味着目前网络已经过载，也就是说网络已经出现了拥堵，此时如果仍然不断的尝试重传，无疑会进一步加重网络的负担，使得丢包变得更加频繁，然而这又进一步加剧了重传....，此时整个网络已经陷入恶性循环，最终走向瘫痪。

#### 基本思想

为了避免这种情况的发生，TCP协议使用了拥塞控制机制，目的是根据网络的拥塞状况动态的调整TCP发送端的发送速率。这样我们就能够让网络环境保持一种同时具有高吞吐量，低延时，低丢包率的平衡状态。在此之前的滑动窗口协议能够让发送方根据接收方回传的通知窗口(awnd)的值来调整自身窗口大小，以便发送速率能够跟上处理速率。现在我们要引入一个称为拥塞窗口(cwnd)的变量，该变量能够估算当前网络的最佳承载能力，并随着网络的拥塞程度而不断变化。此时发送方的实际窗口值(W)需要取这两者的较小值，用公式表示如下：

$$
W=min(cwnd，awnd)
$$

通知窗口可以通过返回的ACK头部信息获得，但是要如何才能获取拥塞窗口的值呢？我们可以考虑逐步的给网络施加压力，以此来探索网络中的最佳承载能力。刚开始时，拥塞窗口取一个较小值，随后每当收到一个连续的ACK就增加拥塞窗口的大小，如果出现丢包则表明很有可能网络此时已经拥塞，所以此时减少拥塞窗口的值，就这样拥塞窗口的值随着网络环境的变化而不断的被调整。与此同时，当通知窗口(awnd)足够大时，发送方的实际窗口大小就取值于拥塞窗口的大小，这也就使得发送速率随着网络环境而动态变化。

拥塞控制算法的前提是要判断出何时出现拥塞，最简单的是根据丢包情况来进行判别，复杂点的可以根据延时情况来判断，还可以让节点路由器配合告知拥塞情况，这种方法叫做显式拥塞通知，不过由于涉及全球大量路由器的更新，现在还不是很普及。本文就介绍几种常见的拥塞控制算法，对比不同算法间的区别，以此加深对TCP协议拥塞控制过程的理解。

#### 基于丢包的拥塞控制算法

##### Tahoe算法

该算法最早于20世纪80年代的4.2版本的Unix系统中提出，算法主要包含两个阶段，分别是慢启动阶段和拥塞避免阶段。这两个阶段在同一时刻只有一个会被运行，因此算法利用慢启动阈值(ssthresh)来决定在任意给定时刻该运行哪个阶段。当cwnd < ssthresh时，执行慢启动过程；当cwnd > ssthresh时，执行拥塞避免过程；当cwnd = ssthresh时，随便执行哪个都行。

慢启动

每收到一个ACK时，$cwnd = cwnd + 1$



拥塞避免

##### Reno算法(标准算法)

快速恢复



##### NewReno算法

对快速恢复进行改进



##### RHBP算法

优化快速重传机制



##### BIC算法

在高速网络下能保证公平性

 

##### CUBIC算法

对BIC算法的改进，改进了BIC某些情况下增长过快的不足。



#### 基于延迟的拥塞控制算法

##### Vegas算法



##### WestWood算法



##### BBR算法

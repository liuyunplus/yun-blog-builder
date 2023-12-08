### 1 Background

The TCP protocol is a reliable network transmission protocol. To ensure the reliability of data transmission, the sender will initiate retransmissions when it detects packet loss. This ensures that the receiver receives complete data, and the entire process is automated, making everything seem ideal. However, without proper control, it can lead to catastrophic consequences. Imagine that in general, packet loss may indicate that the network is already overloaded, meaning it's congested. If continuous retransmission attempts are made at this point without control, it will undoubtedly further burden the network, leading to more frequent packet losses. This, in turn, exacerbates the retransmission issue. At this point, the entire network falls into a vicious cycle, ultimately leading to paralysis.

### 2 Basic Idea

To prevent this situation, the TCP protocol employs a congestion control mechanism with the goal of dynamically adjusting the sending rate of the TCP sender based on the network's congestion condition. This allows us to maintain a balanced network environment with high throughput, low latency, and low packet loss simultaneously. Prior to this, the sliding window protocol allowed the sender to adjust its window size based on the value of the receiver's advertised window (awnd) to keep up with the processing rate. Now, we introduce a variable called the congestion window (cwnd), which estimates the current network's optimal capacity and continuously adapts based on the degree of congestion in the network. At this point, the sender's actual window value (W) should be the minimum of these two, as represented by the following formula:
$$
W=min(cwnd，awnd)
$$

The advertised window can be obtained from the returned ACK header information, but how can we obtain the value of the congestion window? We can consider gradually applying pressure to the network to explore its optimal capacity. Initially, the congestion window takes a small value, and then, with each consecutive ACK received, it increases in size. If packet loss occurs, it likely indicates network congestion, so the congestion window is reduced at that point. This way, the congestion window value is continuously adjusted based on changes in the network environment. At the same time, when the advertised window (awnd) is sufficiently large, the sender's actual window size is determined by the congestion window size. This allows the sending rate to dynamically adapt to the network environment.

The premise of congestion control algorithms is to determine when congestion is occurring. The simplest way is to discern congestion based on packet loss, but more sophisticated methods involve assessing delays or having network routers collaborate to report congestion, which is known as explicit congestion notification. However, the latter method is not yet widespread due to the need for updates across a large number of routers globally. This article introduces several common congestion control algorithms, compares the differences between them, and aims to enhance the understanding of the congestion control process in the TCP protocol.

### 3 Loss-Based Algorithms

#### 3.1 Tahoe

The Tahoe algorithm primarily consists of three mechanisms: Slow Start**, **Congestion Avoidance, and Fast Retransmit. When a connection is initially established, the Slow Start process is executed. During this phase, the sending window (cwnd) grows exponentially with the round-trip time (RTT) until it exceeds the Slow Start threshold (ssthresh). Afterward, it enters the Congestion Avoidance phase, where the sending window grows linearly with the RTT, progressively approaching the network's congestion threshold. If packet loss occurs during this phase, either due to a timeout or Fast Retransmit, the sending window is immediately set to 1, and the connection re-enters the Slow Start phase. Throughout the entire transmission process, Slow Start and Congestion Avoidance processes alternate continuously to dynamically control the sending window size. The diagram below illustrates how the sending window size changes over time.

![tcp_tahoe_line](../image/tcp_tahoe_line.svg)

**(1) Slow Start**

The entire Slow Start process can be summarized as follows:

- Initialize the cwnd with a value of 1, indicating the ability to transmit data of one MSS size.
- Whenever an ACK is received, set cwnd = cwnd + 1, leading to linear growth.
- After each round-trip time (RTT), set cwnd = cwnd^2, leading to exponential growth.
- Set the slow start threshold (ssthresh), when cwnd >= ssthresh, transition into the congestion avoidance phase.

![TCP拥塞控制-慢启动](https://raw.githubusercontent.com/liuyunplus/yun-images/master/aqNu0f.svg)

**(2) Congestion Avoidance**

The congestion avoidance phases are as follows:

- Whenever an ACK is received, set cwnd = cwnd + 1/cwnd.
- Every time an RTT passes, set cwnd = cwnd + 1, following a linear growth pattern.
- In the event of a timeout and packet loss, set sshthresh =  cwnd / 2, and cwnd = 1, entering the slow start phase.

![TCP拥塞控制-拥塞避免](https://raw.githubusercontent.com/liuyunplus/yun-images/master/gbIClA.svg)

**(3) State Machine**



![](../image/tcp-tahoe-state.svg)

**(5) Problems**

The problem with Tahoe is that it take a complete timeout interval to detect a packet loss and in fact, in most implementations it takes even longer because of the coarse grain timeout. Also since it dosen't send immediate ACK's, it sends cumulative acknowledgements, there fore it follows a 'go-back-n' approach. Thus every time a packet is lost it waits for a timeout and the pipeline is emptied. This offers a major cost in high band-width delay product links.

#### 3.2 Reno

As can be seen from the above, the Tahoe algorithm will set the send window to 1 and start the slow start phase during fast retransmission. We know that fast retransmission is caused by receiving three duplicate ACKs. Since duplicate ACKs can be received, it means that the network situation is not that bad. There is no need to react as violently as timeout packet loss. In this case, the network throughput will be lower. Therefore, the Reno algorithm proposes a fast recovery mechanism based on the Tahoe algorithm.

![tcp_tahoe_line](../image/tcp_reno_line.svg)

**(1) Fast Recovery**

The fast recovery phases are as follows:

- When a duplicate ACK is received, set cwnd = cwnd + 1, continuing in the fast recovery phase.
- When a fresh ACK is received, set cwnd = sshthresh, entering the congestion avoidance phase.
- If packet loss occurs due to timeout, then set sshthresh =  cwnd / 2, and set cwnd = 1, and enters the slow start phase.

**(2) State Machine**

![tcp-reno-state](../image/tcp-reno-state.svg)

**(3) Problems**

The biggest challenge with the Reno algorithm is that when multiple packets are lost within the same window, it can lead to premature exit from the fast retransmit phase and result in multiple reductions in CWND. As shown below, when the sender receives 3 duplicate ACKs, it triggers a fast retransmiss-ion of the lost packet and enters the fast recovery phase. At this point, the arrival of an ACK for packet 3 is treated as a new ACK, causing the sender to halve CWND and exit the fast retransmit phase, entering the congestion avoidance phase. However, it's important to note that packet 3 is also lost, so the sender subsequently receives duplicate ACKs for packet 3. This leads to the sender retransmitting packet 3 again and re-entering the fast retransmit phase. When multiple packets are lost, this process may repeat several times, resulting in a rapid reduction in CWND throughout the entire process.

![](../image/tcp-new-reno.svg)

#### 3.3 NewReno

NewReno is a slight modification over Reno. It is able to detect multiple packet losses and thus is much more efficient that Reno in the event of multiple packet losses. Like Reno, NewReno also enters into fast-retransmit when it receives 3 duplicate packets, however it differs from Reno in that it doesn't exit fast-recovery until all the data which was out standing at the time it entered fast-recovery is acknowledged. Thus it overcomes the problem faced by Reno of reducing the CWD multiples times.

The fast-retransmit phase is the same as in Reno. The difference in the fast-recovery phase which allows for multiple re-transmissions is NewReno. Whenever NewReno enters fast-recovery it notes the maximums segment which is outstanding. The fast-recovery phase proceeds as in Reno, however when a fresh ACK is received then there are two cases:

- If it ACK's all the segment which were outstanding when we entered fast-recovery then it exits fast recovery and sets CWD to ssthresh and continues congestion avoidance like Tahoe.

- If the ACK is a partial ACK then it deduces that the next segment in line was lost and it re-transmits that segment and sets the number of duplicate ACKs received to zero.

It exit fast-recovery when all the data in the window is acknowledged.

**Problems:**

NewReno suffers from the fact that its take one RTT to detect each packet loss. When the ACK for the first re-transmitted segment is received only then can we deduce which other segment was lost.

#### 3.4 SACK

TCP with 'Selective Acknowledgments' is an extension of TCP Reno and it works around the problems face by TCP Reno and TCP NewReno, namely detection of multiple lost packets, and re-transmission of more than one lost packet per RTT. It retains the slow-start and fast-retransmit parts of Reno. It also has the coarse grained timeout of Tahoe to fall back on, incase a packet loss is not detected by the modified algorithm.

SACK TCP requires that segments not be acknowledged cumulatively but should be acknowledged selectively. Thus each ACK has a block which describes which segments are being acknowledged. Thus the sender has a picture of which segments have been acknowledged and which are still outstanding. Whenever the sender enters fast-recovery, it initializes a variable pipe which is an estimate of how much data is outstanding in the network, and it also set CWND to half the current size. Every time it receives an ACK it reduces the pipe by 1 and every time it re-transmits a segment it increments it by 1. Whenever the pipe goes smaller than the CWD window it checks which segments are un received and send them. If there are no such segments outstanding then it sends a new packet. Thus more than one lost segment can be sent in one RTT.

**Problems:**

The biggest problem with SACK is that currently selective acknowledgements are not provided by the receiver to implement SACK we'll need to implement selective acknowledegment which is not a very easy task.

#### 3.4 HSTCP

根据数学计算，标准TCP的拥塞窗口w和丢包率p存在某种约束关系，该关系的数学表达式为: $w = 1.2/\sqrt{p}$ . 也就是说随着拥塞窗口w的增大，丢包率p必须足够小才行，这使得标准TCP无法充分利用高带宽网络。假设当前带宽为10Gbps， 往返时间为100ms，每个包的字节数为1500 byte。为了能充分利用带宽，拥塞窗口w要达到 83,333 segments。此时可以计算最大丢包率 $p = 1.5 / w^2  \approx 1/5,000,000,000$ , 也就是说发送5000000000个包最多只能丢一个包。可以计算丢包间隔时间 $S = ((1/p ÷ w) × 100) ÷ 1000 ≈ 6000s ≈ 1.7h$，也就是说至少隔1.7小时才能丢一个包，这显然是不可能的。

##### 3.4.1 修改响应函数

- 当 cwnd <= Low_Window 时, 使用标准TCP响应函数 $w = 1.2/\sqrt{p}$ 。
- 当 cwnd > Low_Window 时, 使用修改后的响应函数 $w = (p/\text{Low\_P})^S \times \text{Low\_Window}$ 。

下面是一些参数说明: 

Low_Window: 表示最小窗口，只有大于最小窗口才使用HSTCP算法。

Low_P: 在最小窗口时的丢包率。

High_Window: 根据带宽来预估要达到的最大窗口。

High_P: 预估在最大窗口时能接受的丢包率。

还有一个 S 参数，它的值通过下面公式计算得到。

$S = \large \frac{log(\text{Hight\_Window}) - log(\text{Low\_Window})}{log(\text{High\_P}) - log(\text{Low\_P})}$

##### 3.4.2 转成控制参数

有了上面的响应函数后，还需要将响应函数转成拥塞控制的参数。

- 未出现拥塞事件的时候，cwnd按照以下公式增加: $w = w + a(w)/w$
- 出现拥塞事件的时候，cwnd按照以下公式减少: $w = w - b(w)*w$

在标准TCP中，a(w)的值就固定为1，b(w)固定为1/2。而现在，要把这两个参数做成动态可配置的。

- 当 w <= Low_Window 时，还是和标准TCP一样，不做任何改变，也就是 $a(w) = 1$，$b(w) = {\large \frac{1}{2}}$ 。

- 当 Low_Window < w < High_Window 时，a 和 b 通过下面函数计算得到。

  $b(w) = (\text{{\small High\_Decrease}} - 0.5) \times {\large \frac{log(w) - log(\text{Low\_Window})}{log(\text{High\_Window}) - log(\text{Low\_Window})}}+ 0.5$ 

  $a(w) = {\small W}^2 \times p(w) \times 2 \times {\large \frac{b(w)}{2-b(w)}} $

- 当 w = High_Window 时，a 和 b 通过下面函数计算得到。

  $a(w) = \text{\small High\_Window}^2 \times \text{\small High\_P} \times 2 \times {\large \frac{b(w)}{2-b(w)}}$

  $b(w) = \text{\small High\_Decrease}$

#### 3.5 BIC

一个好的拥塞控制算法需要同时做到以下几点:

- TCP友好性：当和其他使用不同拥塞控制算法的TCP连接共享网络带宽时，不会过度占用网络资源，要让其他连接也能获得公平的份额。
- RTT公平性：当和其他具有不同往返时延的TCP连接共享网络带宽时，不会过度的占用网络资源，要让其他连接也能获得公平的份额。
- 带宽利用率高：在保证上面两点的基础上，要尽可能的充分利用网络带宽，提高吞吐率。

到现在为止，前面几个算法都是基于AIMD的控制算法，也就是说，当发生拥塞控制事件时，大家的表现基本一致，所以到现在为止的算法都能实现TCP友好性。但是HSTCP算法的出现导致有一点不同，那就是HSTCP增加了高延迟TCP连接的攻击性，这样就会挤占低延迟连接的网络资源，也就是出现了RTT不公平的现象，而BIC算法就是为了解决这种RTT不公平现象的。当然，BIC还通过二分搜索算法来充分提高带宽利用率。

##### 3.5.1 二分搜索增长

首先设置最小窗口值，它的值可以是任意的当前没发生过丢包的窗口大小。然后凭经验设置一个会发生丢包的最大窗口值，已知最小窗口值不会发生丢包，而最大窗口值肯定会发生丢包，那么我们理想的窗口大小应该就在这两个值中间，这样就可以用二分查找来快速确定目标窗口大小。在增加窗口大小过程中，如果出现任何丢包，则可以将当前窗口视为新的最大值，并且丢包后减小的窗口大小可以视为新的最小值，然后在这两者之间重新寻找新的平衡点。

这种方法的基本原理是，因为网络在新的最大窗口附近产生了丢包，但在新的最小窗口附近不会产生丢包，因此，目标窗口大小必然位于这两个值的中间。我们使用二分搜索去查找目标窗口，当达到目标窗口大小后，如果没有出现丢包，则当前窗口大小变为新的最小值，并计算新的目标。使用更新后的最小值和最大值重复此过程，直到最大值和最小值之间的差值低于预设阈值，也被称为最小增量 $S_{min}$。

##### 3.5.2 加法增加

为了确保更快的收敛和 RTT 公平性，我们将二分搜索增加与加法增加策略相结合。当距离当前最小值到中点的距离太大时，直接将窗口大小增加到该中点可能会给网络带来太大的压力。在二分查找过程中，如果当前窗口大小和下一步目标窗口大小的距离大于最大增量 $S_{max}$ 时，我们不会在下一个RTT中直接将窗口大小增加至中点，而是只增加 $S_{max}$ ，直到当前窗口大小和目标窗口大小距离小于 $S_{max}$ 时，此时再将当前窗口大小直接增加到目标大小。

因此，在大幅减少窗口之后，该策略首先线性增加窗口，然后以对数方式增加。 我们将这种二分查找增加和加法增加的组合称为二分增加。

结合乘法减少策略，二分增加在大窗口下变得接近纯加法增加。这是因为较大的窗口导致乘法减少的减少量更大，因此加法增加周期更长。当窗口尺寸较小时，它变得接近纯二分搜索增加，这样也就会导致更短的加法增加周期。

**超过最大值后**

当窗口增长超过当前最大值后，最大值是未知的。此时，二分查找将其最大值设置为默认最大值(一个大常数)，并将当前窗口大小设置为最小值。所以目标中点可能很远。根据二分增加策略，如果目标中点和当前窗口的距离很大，则按照最大增量进行线性增加。

相反，我们运行“慢启动”策略来探测高达 $S_{max}$ 的新最大值。因此，如果 cwnd 是当前窗口并且最大增量为 $S_{max}$，则它在每个 RTT 轮中以 cwnd+1、cwnd+2、cwnd+4、...、cwnd+$S_{max}$ 的步长增加。理由是，由于它可能处于饱和点并且最大值未知，因此它会以“慢启动”方式探测可用带宽，直到可以安全地将窗口增加 $S_{max}$。慢启动后，切换为二进制递增。

##### 3.5.3 快速收敛

假设有两个流具有不同的窗口大小，但具有相同的 RTT。由于较大的窗口在乘法减少中减少更多（使用固定因子 β），因此对于较大的窗口，达到目标的时间较长。然而，它的收敛时间可能会很长。在二分搜索增加中，在窗口减少 d 后需要 log(d)-log(Smin) RTT 轮才能达到最大窗口。由于窗口以对数步长增加，因此较大的窗口和较小的窗口几乎可以同时非常快地回到各自的最大值（尽管较小的窗口流达到最大值的速度稍快一些）。因此，在下一次窗口减小之前，较小的窗口流最终仅从较大的流中占用少量带宽。为了纠正这种行为，我们按如下方式修改二分搜索增长。



在二分搜索增加中，在窗口缩小之后，设置新的最大值和最小值。假设这些值为流 i (i=1, 2) 的 $max\_win_i$ 和 $min\_win_i$ 。如果新的最大值小于前一个，则该窗口处于下降趋势（因此可能有一个大于公平份额的窗口）。然后，我们重新调整新的最大值，使其与新的目标窗口相同（即 max_wini=(max_wini-min_wini)/2），然后重新调整目标。然后我们应用正常的二进制增加。我们称这种策略为快速收敛。



假设流 1 的窗口是流 2 的两倍。由于窗口以 log 步长增加，收敛搜索（将较大窗口的最大值减少一半）允许两个流大约同时达到最大值；在超过最大值后，两个流都进入慢启动，然后加性增加，在此期间它们的增加率相同，并且平均共享 max_win1-(max_win1-min_win1)/2 的带宽。这使得两个流比纯二进制增加更快地收敛。



##### 3.5.3 Pseudocode

If no packets are dropped, the congestion window (cwnd) increases in three distinct ways: binary search increase, additive increase, and slow start. In each step, one is used as an increment.

One step of increasing cwnd:

```
if (cwnd < wmax)          // binary search OR additive
  bic_inc = (wmax - cwnd) / 2;
else                      // slow start OR additive
  bic_inc = cwnd - wmax;
if (bic_inc > Smax)       // additive
  bic_inc = Smax;
else if (bic_inc < Smin)  // binary search OR slow start
  bic_inc = Smin;
cwnd = cwnd + (bic_inc / cwnd);
```

If one or more packets are dropped, the cwnd is reduced using multiplicative decrease. This requires β, which is used in decreasing cwnd by (100×β)%. In the case of two flows, one with a large cwnd and the other a small cwnd, *fast convergence* is used to decrease the greater cwnd flow's wmax at a greater rate than the smaller cwnd's flow to allow faster convergence of the greater cwnd's flow when increasing its cwnd.

One step of decreasing cwnd:

```
if (cwnd < wmax) // fast convergence
  wmax = cwnd * (2-β) / 2;
else 
  wmax = cwnd;
cwnd = cwnd * (1-β);
```



#### 3.6 CUBIC

对BIC算法的改进，改进了BIC某些情况下增长过快的不足。

On detection via duplicate ACKs:

$W_{max} = cwnd$

$ssthresh = max(2, \ cwnd * \beta)$

$cwnd = cwnd * \beta$

On detection via a timeout, it is the same except for cwnd:

cwnd = RW = min(cwnd, IW)



### 4 Delay-Based Algorithms

#### 4.1 Vegas

Vegas is a TCP implementation which is a modification of Reno. The experiments demonstrate that, compared to Reno, Vegas can increase throughput by 40% to 70%, and the amount of retransmitted data is only 20% to 50% of the Reno.

##### (1) New Retransmission Mechanism

In Reno, round trip time(RTT) and variance estimates are computed using a coarse-grained timer (around 500 ms), meaning that the RTT estimate is not very accurate. This coarse granularity influences both the accuracy of the calculation itself, and how often TCP checks to see if it should time out on a segment. Reno not only retransmits when a coarse-grained timeout occurs, but also when it receices 3 duplicate ACKs. Reno sends a duplicate ACK whenever it receives new data that it cannot acknowledge because it has not yet received all the previous data.

Vegas extends Reno's retransmission mechanisms as follows. First, Vegas reads and records the system clock each time a segment is sent. When an ACK arrives, Vegas reads the clock again and does the RTT calculation using this time and the timestamp recorded for the relevant segment. Vegas then uses this more accurate RTT estimate to decide to retransmit in the following two situations:

- When a duplicate ACK is received, Vegas checks to see if the difference between the current time and the timestamp recorded for the relevant segment is greater than the timeout value. If it is, then Vegas retransmits the segment without having to wait for 3 duplicate ACKs. In many case, losses are either so great or the window so small that the sender will never receive three duplicate ACKs, and therefore, Reno would have to rely on the coarse-grained timeout mentioned above.
- When a non-duplicate ACK is received, if it is the first or second one after a retansmission, Vegas again checks to see if the time interval since the segment was sent is larger than the timeout value. If it is, then Vegas retransmits the segment. This will catch any other segment that may have been lost previous to the retransmission without having to wait for a duplicate ACK.

In other words, Vegas treats the receipt of certain ACKs as a trigger to check if a timeout should happen. It still contains Reno's coarse-grained timeout code in case these mechanisms fail to recognize a lost segment.

##### (2) Congestion Avoidance Mechanism

TCP Reno's congestion detection and control mechanism uses the loss of segments as a signal that there is congestion in the network. It has no mechanism to detect the incipient stages of congestion--before losses occur--so they can be prevented. Reno is reactive, rather than proactive, in this respect. As a result, Reno needs to create losses to find the available bandwidth of the connection. 

Vegas' approach is most similar to Tri-S, in that it looks at changes in the throughput rate. However, it differs from Tri-S in that it calculates throughputs differently, and instead of looking for a change in the throughput slope, it compares the measured throughput rate with the expected throughput rate. The simple idea that Vegas exploits is that the number of bytes in transit is directly proportional to the expected throughput, and therefore, as the window size increases -- causing the bytes in transit to increase -- the throughput of connection should also increase.

Step1: Define a given connection's BaseRTT to be the RTT of a segment when the connection is not congested. In practice, Vegas sets BaeRTT to the minimum of all measured round trip times.

Step2: Calculates the expected throughput: Expected = WindowSize / BaseRTT. where WindowSize is the size of the current congestion window, which we assume for the purpose of this discussion, to be equal to the number of bytes in transmit.

Step3: Calculates the current actual sending rate: Actual = transmittedBytes / transmittedRTT. This calculation is done once per round-trip time.

Step4: Compares Actual to Expected, and adjusts the window accordingly. Let Diff = Expected - Actual. Note that Diff is positive or zero by definition, since Actual > Expected implies that we need to change BaseRTT to the latest sampled RTT. Also define two thresholds, α < β, roughly corresponding to having too little and too much extra data in the network, respectively:

- when Diff < α, increases the congestion window linearly during the next RTT.

- when Dif > β, decreases the congestion window linearly during the next RTT. 

- when α < Diff < β, leaves the congestion window unchanged.

##### (3) Modified Slow-Start Mechanism

Vegas expects that as network bandwidth increases, the expected loss of slow-start will similarly increase. To be able to detect and avoid congestion during slow-start, Vegas allows exponential growth only every other RTT. In between, the congestion window stays fixed so a valid comparison of the expected and actual rates can be made. When the actual rate falls below the expected rate by a certain amount, call this the y threshold, Vegas changes from slow-start mode to linear increase/decrease mode.

#### 4.2 WestWood



#### 4.3 BBR

ProbeBW

ProbeRTT

问题: 基于丢包的算法与BBR算法竞争可能会被挤出去

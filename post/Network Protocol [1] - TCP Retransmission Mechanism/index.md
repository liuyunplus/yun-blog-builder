#### 1. Foreword

We all know that physical network media are prone to fluctuations due to environmental factors, which can result in data corruption or loss during transmission. How to ensure that the receiver receives the exact data sent by the sender in such an environment has been a challenge for scientists for many years. Currently, there are two main approaches to address this issue. To tackle data corruption, we can use error detection and correction codes. For data loss, the only solution is to retransmit the data packets. TCP (Transmission Control Protocol) is a reliable data transmission protocol that utilizes both error detection codes and retransmission mechanisms to ensure data integrity. In this article, we will focus on TCP's retransmission mechanism. Retransmission of data packets is triggered when packet loss is detected. TCP determines packet loss based on a series of acknowledgement messages sent from the receiver back to the sender. Depending on the criteria used to determine packet loss, retransmission can be classified into timeout retransmission, fast retransmission, and selective retransmission. We will now discuss each of these in detail.

#### 2. Timeout retransmission

When the sender transmits each segment, it sets a timer for that segment. If the sender does not receive an acknowledgement (ACK) from the receiver within a specified time, it assumes that a packet loss has occurred and initiates a retransmission. The challenge here is determining the appropriate timeout value. If the timeout is set too short, it may result in retransmitting packets unnecessarily, leading to network congestion. On the other hand, if the timeout is set too long, it may result in underutilization of the network, reducing throughput. Additionally, the timeout value needs to be dynamically adjusted based on the changing network conditions. The setting of the Retransmission TimeOut (RTO) has a significant impact on the transmission performance of the TCP protocol. Since the underlying protocols do not provide exact information about the network environment, the TCP protocol needs to design and collect sample data on its own. One way to dynamically estimate the RTO value is by measuring the Round Trip Time (RTT), which is the time taken for a data packet to travel from the sender to the receiver and back, including the time for the ACK to be received. During the process of determining the appropriate RTO value, several typical solutions have been developed.

##### 2.1 Common solution

##### 2.1.1 Classic algorithm

```
SRTT = α(SRTT) + (1-α)RTTs               (1.1)
RTO = min(ubound, max(lbound, (SRTT)β))  (1.2)
```

As shown in Formula 1.1, SRTT represents the average value of a set of RTT samples. Whenever a new RTT sample is obtained, SRTT is updated. The recommended value for the smoothing factor, α, is between 0.8 and 0.9. This means that 80% to 90% of the new SRTT value is based on the existing value, while 10% to 20% is based on the new measurement. This method is known as weighted moving average, which allows the SRTT value to dynamically adjust with changes in the network environment. Generally, the RTO should be slightly larger than the average of the RTT samples. Therefore, we multiply SRTT by a constant β, which is recommended to be between 1.3 and 2.0, to obtain the final RTO value. To ensure that the RTO value fluctuates within a reasonable range, Formula 1.2 sets upper and lower bounds for RTO. The recommended value for the upper bound (ubound) is 1 minute, while the recommended value for the lower bound (lbound) is 1 second. This algorithm performs well in relatively stable RTT distribution environments.

##### 2.1.2 Karn algorithm

When using classic algorithms to measure RTT samples, there is an issue of retransmission ambiguity. The retransmission ambiguity problem arises when a packet experiences a timeout and gets retransmitted, followed by the receipt of an acknowledgement (ACK). In this scenario, there is ambiguity as to whether the ACK is confirming the first transmission or the second transmission. When measuring RTT samples for retransmitted packets, the following two situations may occur:

a) Measuring the interval between the first transmission and the arrival of the ACK. If the ACK confirms the second transmission, the RTT will be inflated.

b) Measuring the interval between the second transmission and the arrival of the ACK. If the ACK confirms the first transmission, the RTT will be underestimated.

![](./image/1.svg)

To avoid the inaccuracy of RTT sample values for retransmitted data and its impact on the statistical estimation of the average RTT, the first part of the Karn algorithm involves ignoring retransmissions. This means that retransmitted packets are not included in the RTT sample collection. However, this approach can lead to another problem. If there is a sudden network jitter causing significant delays, all packets may be retransmitted due to timeouts. Since the retransmitted data is not considered in the RTT sample statistics, the RTO remains at a small value, leading to unnecessary packet retransmissions and network congestion. The second part of the Karn algorithm addresses this issue by doubling the back-off factor. This means that whenever a retransmission occurs, the RTO value is doubled. Although this method can solve the aforementioned problem, it may also reduce the transmission performance of TCP. A better approach is to use the timestamp option to avoid the retransmission ambiguity problem.

##### 2.1.3 Jacobson algorithm

```
srtt = (1-g)(srtt) + (g)M                 (1.3)
rttvar = (1-h)(rttvar) + (h)(|M-srtt|)    (1.4)
RTO = srtt + 4(rttvar)                    (1.5)
```

Previously, we mentioned that the RTO value should be slightly larger than the average of the RTT samples. In classic algorithms, this is achieved by multiplying the SRTT by a constant β to obtain the final RTO value. However, this method lacks flexibility. Therefore, the Jacobson algorithm improves upon this approach by using the mean deviation as the difference between RTO and SRTT. This ensures that when the distribution of RTT is more stable, the RTO value is closer to SRTT. Conversely, when the RTT fluctuates more, the RTO value becomes larger than SRTT. The complete calculation process is shown in Formulas 1.3 to 1.5. In these formulas, M represents the newly measured RTT sample value, the parameter g is recommended to be set as 1/8, rttvar represents the mean deviation, the parameter h is recommended to be set as 1/4, and the RTO value is obtained by adding srtt and four times rttvar.

##### 2.2 The scheme adopted by Linux

Although the Jacobson algorithm is the standard method used by the TCP protocol to estimate RTO, it still has some issues. For example, when the RTT sample suddenly decreases, the RTO value should ideally decrease instead of increasing. Additionally, when using more frequent RTT measurements and finer clock granularity, the value of the mean deviation rttvar can easily decrease to a minimum over time. Linux has made improvements upon this algorithm to avoid these issues.

(1) To address the issue of rttvar decreasing to a minimum over time during frequent RTT measurements, Linux sets a minimum value for rttvar. The value of rttvar is obtained from the maximum estimated mean deviation during the measurement of RTT samples, without going below a lower bound. The complete formula is as follows. The variable mdev records the instantaneous estimated mean deviation, equivalent to rttvar in the standard method. The mdev_max variable is used to store the maximum estimated mean deviation during the measurement process, with its minimum value set to 50ms. Since the value of rttvar synchronizes with mdev_max, it ensures that the minimum value of RTO is not less than 200ms, thereby resolving the issue of rttvar decreasing to a minimum over time during frequent measurements.

```
srtt = (1-g)(srtt) + (g)M             (1.6)
mdev = (1-h)(mdev) + (h)(|M-srtt|)    (1.7)
mdev_max = max(mdev_max, mdev)        (1.8)
rttvar = mdev_max                     (1.9)
RTO = srtt + 4(rttvar)                (2.0)
```

(2) To prevent the issue of increasing RTO when a new sample value is below the lower bound of the RTT estimation range, the weight of the new sample is reduced. The specific implementation approach is provided by the following code snippet. When the new measurement sample value m is less than the estimation range lower bound (srtt - mdev), it indicates that the RTT is experiencing a sharp decrease. By reducing the weight of the mean deviation |srtt - m| of the new sample to 1/8 of its original weight, the problem of increasing RTO due to the increase in mdev can be avoided.

```c
if(m < (srtt - mdev)) {
    mdev = (31/32)*mdev + (1/32)*|srtt - m|
} else {
    mdev = (3/4)*mdev + (1/4)*|srtt - m|
}
```

#### 3. Fast retransmit

The Fast Retransmit mechanism triggers retransmission based on feedback information from the receiving end, rather than relying on the timeout of the retransmission timer. Therefore, compared to Timeout Retransmission, Fast Retransmit can more promptly and effectively address packet loss situations. Typical TCP implementations incorporate both of these retransmission mechanisms. The working principle of Fast Retransmit is as follows: when the receiver receives an out-of-order packet, it immediately sends a duplicate ACK. Upon receiving a certain number of duplicate ACKs, the sender retransmits the previous packet. Since receiving duplicate ACKs does not necessarily mean that the packet has been lost, but could be caused by packet reordering in the network, the sender waits for the number of duplicate ACKs to reach a certain threshold before initiating retransmission. Typically, this threshold is set to 3, but some implementations may dynamically adjust the threshold based on the current level of packet reordering. The specific workflow is illustrated in the diagram below.

![](./image/2.svg)

#### 4. Selective retransmission

Although Fast Retransmit can more promptly detect packet loss compared to Timeout Retransmission, it cannot precisely determine which packets are lost. As a result, it may retransmit packets that have already been received correctly, thereby reducing the transmission efficiency of TCP. For example, in the diagram above, the sender receives three consecutive duplicate ACKs. However, since these duplicate ACKs can be triggered by any packet after Segment 2, the sender cannot determine whether it needs to retransmit other packets after Segment 2. To address this issue, TCP introduces the Selective Acknowledgment (SACK) option in the header. By using the SACK option, an ACK can include three or four SACK blocks that inform the sender about the missing out-of-order data. Each SACK block contains the starting and ending sequence numbers of the out-of-order data. Therefore, disregarding congestion control, with the SACK option, the sender can fill up to three gaps in the receiver's buffer within one Round Trip Time (RTT), effectively improving the transmission performance of TCP. The specific working principle is illustrated in the diagram below.

![](./image/3.svg)

#### 5. References

> 1. [TCP/IP Illustrated, Volume 1: The Protocols](https://book.douban.com/subject/1088054/)
> 2. [TCP的哪些事儿(上)  || 酷壳 - CoolShell](https://coolshell.cn/articles/11564.html) 
> 3. [TCP的哪些事儿(下)  || 酷壳 - CoolChell](https://coolshell.cn/articles/11609.html) 
> 4. [Improving Round-Trip Time Estimates in Reliable Transport Protocols](chrome-extension://ikhdkkncnoglghljlkmcimlnlhkeamad/pdf-viewer/web/viewer.html?file=http%3A%2F%2Fccr.sigcomm.org%2Farchive%2F1995%2Fjan95%2Fccr-9501-partridge87.pdf)
> 5. [Transmission Control Protocol (TCP) - Wikipedia](https://zh.wikipedia.org/wiki/%E4%BC%A0%E8%BE%93%E6%8E%A7%E5%88%B6%E5%8D%8F%E8%AE%AE)

